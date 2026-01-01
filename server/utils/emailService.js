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
        const supportEmail = process.env.SUPPORT_EMAIL || 'divvyupteam@gmail.com';
        const appLink = process.env.APP_LINK || 'http://localhost:5173';

        const subject = 'Welcome to DivvyUp!';

        const html = `
<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
    <p>Hi <strong>${name}</strong>,</p>
    <p>Welcome to <strong>DivvyUp</strong> — we’re glad to have you.</p>
    <p>DivvyUp helps you manage shared expenses clearly and fairly, so everyone knows what they owe and why.</p>
    <p>To get started, create your first group and add an expense. It only takes a moment and gives you a full overview of shared costs.</p>
    <p>👉 <a href="${appLink}" style="color: #4F46E5; font-weight: bold; text-decoration: none;">Get started: ${appLink}</a></p>
    <p>If you have any questions or need support, you can reach us at <a href="mailto:${supportEmail}">${supportEmail}</a>. We’re here to help.</p>
    <p>Thank you for choosing DivvyUp.</p>
    <br>
    <p>Best regards,<br>The DivvyUp Team</p>
</div>
`;

        if (!resend) {
            console.error("Resend API key not configured. Email not sent.");
            return { success: false, error: 'Resend API key missing' };
        }

        const data = await resend.emails.send({
            from: 'DivvyUp <onboarding@resend.dev>',
            to: email,
            subject: subject,
            html: html
        });

        console.log("Message sent: %s", data.id);
        return data;

    } catch (error) {
        console.error("Error sending welcome email:", error);
        return { success: false, error: error.message };
    }
};
