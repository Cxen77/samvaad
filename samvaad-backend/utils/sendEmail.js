import nodemailer from 'nodemailer';
import axios from 'axios';

// ─── DEVELOPMENT: Gmail SMTP ──────────────────────────────
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000
        });
    }
    return transporter;
};

// ─── HTML email template ──────────────────────────────────
const buildHtml = (messageText) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #2563EB;">Fuseon</h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; line-height: 1.5;">${messageText.replace(/\n/g, '<br>')}</p>
        </div>
        <div style="margin-top: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px;">
            <p>You're receiving this email because you recently requested a verification code or password reset for your Fuseon account.</p>
            <p>If this wasn't you, please ignore this email.</p>
            <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} Fuseon. All rights reserved.</p>
        </div>
    </div>
`;

// ─── PRODUCTION: Brevo HTTP API ───────────────────────────
const sendViaBrevo = async (options) => {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'no-reply@fuseon.in';
    const senderName = process.env.BREVO_SENDER_NAME || 'Fuseon';

    const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
            sender: { name: senderName, email: senderEmail },
            to: [{ email: options.email }],
            subject: options.subject,
            textContent: options.message,
            htmlContent: buildHtml(options.message)
        },
        {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        }
    );

    return response.data;
};

// ─── DEVELOPMENT: Gmail SMTP ──────────────────────────────
const sendViaSmtp = async (options) => {
    const message = {
        from: `Fuseon Team <${process.env.EMAIL_USER}>`,
        to: options.email,
        replyTo: process.env.EMAIL_USER,
        subject: options.subject,
        text: options.message,
        html: buildHtml(options.message)
    };

    await getTransporter().sendMail(message);
};

// ─── Main send function ───────────────────────────────────
const sendEmail = async (options) => {
    if (process.env.NODE_ENV === 'production' && process.env.BREVO_API_KEY) {
        await sendViaBrevo(options);
    } else {
        await sendViaSmtp(options);
    }
};

/**
 * Fire-and-forget email: sends in background, never blocks the caller.
 * Logs errors but doesn't throw.
 */
export const sendEmailAsync = (options) => {
    sendEmail(options).catch(err => {
        console.error('Background email send failed:', err.message);
    });
};

export default sendEmail;
