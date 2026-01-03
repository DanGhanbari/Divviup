const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

exports.verifyConnection = async () => {
    // Resend doesn't have an explicit verify method like Nodemailer transporter
    // We can check if the API key is present
    if (process.env.RESEND_API_KEY) {
        console.log('✅ Resend service configured with API key');
    } else {
        console.error('❌ Resend API Key missing');
    }
};

exports.sendWelcomeEmail = async (email, name) => {
    try {
        const supportEmail = process.env.SUPPORT_EMAIL || 'team@divviup.xyz';
        const appLink = process.env.APP_LINK || 'https://divviup.xyz'; // Updating app link too since they have a domain

        const subject = 'Welcome to DivviUp!';

        const html = `
<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
    <p>Hi <strong>${name}</strong>,</p>
    <p>Welcome to <strong>DivviUp</strong> — we’re glad to have you.</p>
    <p>DivviUp helps you manage shared expenses clearly and fairly, so everyone knows what they owe and why.</p>
    <p>To get started, create your first group and add an expense. It only takes a moment and gives you a full overview of shared costs.</p>
    <p>👉 <a href="${appLink}" style="color: #4F46E5; font-weight: bold; text-decoration: none;">Get started: ${appLink}</a></p>
    <p>If you have any questions or need support, you can reach us at <a href="mailto:${supportEmail}">${supportEmail}</a>. We’re here to help.</p>
    <p>Thank you for choosing DivviUp.</p>
    <br>
    <p>Best regards,<br>The DivviUp Team</p>
</div>
`;

        if (!resend) {
            console.error("Resend API key not configured. Email not sent.");
            return { success: false, error: 'Resend API key missing' };
        }

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'DivviUp <team@divviup.xyz>',
            to: email,
            subject: subject,
            html: html
        });

        if (error) {
            console.error("Error from Resend:", error);
            return { success: false, error };
        }

        console.log("Message sent: %s", data?.id);
        return { success: true, messageId: data?.id };

    } catch (error) {
        console.error("Error sending welcome email:", error);
        return { success: false, error: error.message };
    }
};

exports.sendInvitationEmail = async (email, inviterName, groupName) => {
    try {
        const supportEmail = process.env.SUPPORT_EMAIL || 'team@divviup.xyz';
        const appLink = process.env.APP_LINK || 'https://divviup.xyz';
        const registerLink = `${appLink}/register?email=${encodeURIComponent(email)}`;

        const subject = `${inviterName} invited you to join ${groupName} on DivviUp`;

        const html = `
<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
    <p>Hi there,</p>
    <p><strong>${inviterName}</strong> has invited you to join the group <strong>"${groupName}"</strong> on <strong>DivviUp</strong>.</p>
    <p>DivviUp makes it easy to split expenses and keep track of shared costs.</p>
    <p>To join the group, you'll need to create an account first.</p>
    <p>👉 <a href="${registerLink}" style="color: #4F46E5; font-weight: bold; text-decoration: none;">Create an account to join</a></p>
    <p>Or visit: ${registerLink}</p>
    <p>If you have any questions, you can reply to this email or contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
    <br>
    <p>Best regards,<br>The DivviUp Team</p>
</div>
`;

        if (!resend) {
            console.error("Resend API key not configured. Invitation not sent.");
            return { success: false, error: 'Resend API key missing' };
        }

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'DivviUp <team@divviup.xyz>',
            to: email,
            subject: subject,
            html: html
        });

        if (error) {
            console.error("Error from Resend:", error);
            return { success: false, error };
        }

        console.log("Invitation sent: %s", data?.id);
        return { success: true, messageId: data?.id };

    } catch (error) {
        console.error("Error sending invitation email:", error);
        return { success: false, error: error.message };
    }
};
