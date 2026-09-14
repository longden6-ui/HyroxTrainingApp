// Email sending [password reset]
import nodemailer from 'nodemailer';

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
    secure: SMTP_PORT === '465',
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = 'Reset your HYROX Coach AI password';
  const body = `We received a request to reset your HYROX Coach AI password.\n\n` +
    `Reset it here: ${resetUrl}\n\n` +
    `This link expires in 1 hour. If you didn't request this, you can safely ignore this email.`;

  const transport = getTransport();
  if (!transport) {
    // No SMTP configured (e.g. local dev) — log the link instead of failing.
    console.log(`[DEV] Password reset email for ${to}:\n${body}`);
    return;
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@hyroxcoach.ai',
    to,
    subject,
    text: body,
  });
}
