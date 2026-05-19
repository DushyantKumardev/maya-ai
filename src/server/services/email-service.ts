import { APP_NAME } from "@/lib/constants";
import nodemailer from "nodemailer";

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Production-ready email service that strictly uses global app-wide environment variables
 * to send system dispatches (e.g. Password recovery links, account verifications).
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailArgs): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // 1. Resend API Strategy
    const resendApiKey = process.env.GLOBAL_ENV_RESEND_API_KEY;
    const resendFromEmail =
      process.env.GLOBAL_ENV_RESEND_FROM_EMAIL ||
      process.env.GLOBAL_ENV_RESEND_FROM;
    const resendFrom = `${APP_NAME} <${resendFromEmail}>`;

    if (resendApiKey && resendFromEmail) {
      const { Resend } = await import("resend");
      const resendInstance = new Resend(resendApiKey);

      const res = await resendInstance.emails.send({
        from: resendFrom,
        to: [to],
        subject,
        html,
        text,
      });

      if (res.error) {
        throw new Error(res.error.message);
      }

      return { success: true, messageId: res.data?.id };
    }

    // 2. SMTP Server Strategy (e.g. Gmail SMTP, Mailgun, SendGrid, etc.)
    const smtpHost = process.env.GLOBAL_ENV_SMTP_HOST;
    const smtpPort = parseInt(process.env.GLOBAL_ENV_SMTP_PORT || "465", 10);
    const smtpSecure =
      process.env.GLOBAL_ENV_SMTP_SECURE === "true" || smtpPort === 465;
    const smtpUser = process.env.GLOBAL_ENV_SMTP_USER;
    const smtpPass = process.env.GLOBAL_ENV_SMTP_PASS;
    const smtpFromEmail = process.env.GLOBAL_ENV_SMTP_FROM;
    const smtpFrom = `${APP_NAME} <${smtpFromEmail}>`;

    if (smtpHost && smtpUser && smtpPass && smtpFromEmail) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
        text,
      });

      return { success: true, messageId: info.messageId };
    }

    // Fallback: If no system-wide email settings are configured
    console.warn(
      "\n⚠️ [EmailService] WARNING: No global SMTP or Resend credentials configured in Environment Variables.",
    );
    console.warn(
      "Please define GLOBAL_ENV_RESEND_API_KEY, or GLOBAL_ENV_SMTP_* credentials in your .env file to enable production recovery dispatches.",
    );
    return {
      success: false,
      error:
        "Global email credentials not configured. Recovery magic link has been printed to the server console.",
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error("[EmailService] Error dispatching email:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
