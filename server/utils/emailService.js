const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'ethereal_user', // Generate ethereal user if needed in real dev
        pass: process.env.EMAIL_PASS || 'ethereal_pass'
    }
});

exports.sendWelcomeEmail = async (email, name) => {
    try {
        const supportEmail = process.env.SUPPORT_EMAIL || 'support@divviup.com';
        const appLink = process.env.APP_LINK || 'http://localhost:5173';

        const subject = 'Welcome to DivvyUp!';
        // Replace placeholders
        const text = `Hi ${name},

Welcome to DivvyUp — we’re glad to have you.

DivvyUp helps you manage shared expenses clearly and fairly, so everyone knows what they owe and why.

To get started, create your first group and add an expense. It only takes a moment and gives you a full overview of shared costs.

👉 Get started: ${appLink}

If you have any questions or need support, you can reach us at ${supportEmail}. We’re here to help.

Thank you for choosing DivvyUp.

Best regards,
The DivvyUp Team`;

        const html = `
<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
    <p>Hi <strong>${name}</strong>,</p>
    <p>Welcome to <strong>DivvyUp</strong> — we’re glad to have you.</p>
    <p>DivvyUp helps you manage shared expenses clearly and fairly, so everyone knows what they owe and why.0</p>
    <p>To get started, create your first group and add an expense. It only takes a moment and gives you a full overview of shared costs.</p>
    <p>👉 <a href="${appLink}" style="color: #4F46E5; font-weight: bold; text-decoration: none;">Get started: ${appLink}</a></p>
    <p>If you have any questions or need support, you can reach us at <a href="mailto:${supportEmail}">${supportEmail}</a>. We’re here to help.</p>
    <p>Thank you for choosing DivvyUp.</p>
    <br>
    <p>Best regards,<br>The DivvyUp Team</p>
</div>
`;

        const info = await transporter.sendMail({
            from: `"DivvyUp Team" <${process.env.EMAIL_USER || 'no-reply@divviup.com'}>`,
            to: email,
            subject: subject,
            text: text,
            html: html
        });

        console.log("Message sent: %s", info.messageId);
        // Preview only available when sending through an Ethereal account
        // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        return info;

    } catch (error) {
        console.error("Error sending welcome email:", error);
        // Don't crash the request if email fails
    }
};
