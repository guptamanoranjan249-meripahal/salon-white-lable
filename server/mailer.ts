import nodemailer from 'nodemailer';

export function hasEmailDeliveryConfig(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
}

export async function sendVerificationEmail(email: string, ownerName: string, verificationUrl: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const from = process.env.EMAIL_FROM;
  if (!host || !from) throw new Error('SMTP email delivery is not configured.');
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const authUser = process.env.SMTP_USER;
  const authPass = process.env.SMTP_PASSWORD;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    ...(authUser && authPass ? { auth: { user: authUser, pass: authPass } } : {}),
    tls: { minVersion: 'TLSv1.2' },
  });
  const safeName = escapeHtml(ownerName);
  const safeUrl = escapeHtml(verificationUrl);
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Verify your Nexora Salon Studio email',
    text: `Hi ${ownerName},\n\nVerify your email and continue setting up your salon website:\n${verificationUrl}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:24px auto;color:#24231f;line-height:1.6"><p>Hi ${safeName},</p><h1 style="font-size:24px;font-weight:500">Verify your email</h1><p>Confirm this address to open your private salon workspace and continue onboarding.</p><p style="margin:28px 0"><a href="${safeUrl}" style="background:#d5b651;color:#17150f;padding:13px 20px;text-decoration:none;border-radius:3px;font-weight:bold">Verify email address</a></p><p style="font-size:13px;color:#777">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p></div>`,
  });
}
