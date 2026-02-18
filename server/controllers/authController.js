const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const emailService = require('../utils/emailService');
const { getIo } = require('../utils/socket');
const crypto = require('crypto');

exports.register = async (req, res) => {
    const { name, email: rawEmail, password } = req.body;

    if (!name || !rawEmail || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const email = rawEmail.toLowerCase(); // Normalize email

    try {
        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await db.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, plan',
            [name, email, hashedPassword]
        );

        // Check for pending invitations (Case insensitive check, though we normalized email above)
        // We also want to ensure we match invitations that might have been saved with mixed case
        const pendingInvites = await db.query(
            "SELECT * FROM group_invitations WHERE LOWER(email) = LOWER($1) AND status = 'pending'",
            [email]
        );

        if (pendingInvites.rows.length > 0) {
            console.log(`Found ${pendingInvites.rows.length} pending invites for ${email}`);
            for (const invite of pendingInvites.rows) {
                // Add to group
                try {
                    await db.query(
                        "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING",
                        [invite.group_id, newUser.rows[0].id]
                    );

                    // Mark invited accepted
                    await db.query(
                        "UPDATE group_invitations SET status = 'accepted' WHERE id = $1",
                        [invite.id]
                    );
                    console.log(`Automatically added user ${newUser.rows[0].id} to group ${invite.group_id}`);

                    // Emit real-time update
                    try {
                        getIo().to('group_' + invite.group_id).emit('group_updated', { type: 'member_added', groupId: invite.group_id });
                        console.log(`Emitted member_added event to group_${invite.group_id}`);
                    } catch (ioErr) {
                        console.error("Socket emit failed:", ioErr);
                    }

                } catch (inviteErr) {
                    console.error("Error processing invite:", inviteErr);
                }
            }
        }

        // Generate Token
        const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send Welcome Email
        console.log(`Attempting to send welcome email to ${newUser.rows[0].email}`);
        emailService.sendWelcomeEmail(newUser.rows[0].email, newUser.rows[0].name)
            .then(result => console.log('Email service result:', result))
            .catch(err => console.error('Background email send failed:', err));

        // Set Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({ user: newUser.rows[0] }); // No token in body
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check user
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Set Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar_url: user.avatar_url,
                plan: user.plan,
                subscription_status: user.subscription_status,
                current_period_end: user.current_period_end
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
    try {
        const userResult = await db.query('SELECT id, name, email, avatar_url, plan, subscription_status, current_period_end FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(userResult.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Both old and new passwords are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    try {
        // Get user hash
        const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect old password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update db
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, req.user.id]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};


exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            // Security: Don't reveal if email exists or not
            return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
        }

        const user = userResult.rows[0];

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Token expires in 1 hour
        const resetExpires = new Date(Date.now() + 3600000);

        // Save token to DB
        await db.query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
            [resetTokenHash, resetExpires, user.id]
        );

        // Send email
        await emailService.sendPasswordResetEmail(user.email, resetToken);

        res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid token
        const userResult = await db.query(
            'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [resetTokenHash]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const user = userResult.rows[0];

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        await db.query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [hashedPassword, user.id]
        );

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
