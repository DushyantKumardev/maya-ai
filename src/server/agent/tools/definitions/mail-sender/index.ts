import nodemailer from "nodemailer";
import { StatusEventParams } from "@/server/agent/stream/emitter";
import { APP_NAME } from "@/lib/constants";

// --------------------
// Types
// --------------------

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  encoding?: string;
  cid?: string;
}

export interface EmailArgs {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  accepted?: string[];
  rejected?: string[];
  error?: string;
  instructions?: string;
  timestamp: string;
}

interface SysOptions {
  userId: string;
  onStatusUpdate: (params: StatusEventParams) => void;
  signal?: AbortSignal;
}

// --------------------
// Constants
// --------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTACHMENT_SIZE_MB = 10;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

// --------------------
// Tool Definition
// --------------------

export const mailSenderTool = {
  type: "function",
  name: "mail-sender",
  description: `Send email via SMTP. Use sign-off: 'Best regards, ${APP_NAME}'. Confirm success to user with recipient, subject, and ID. Set CC/BCC only if explicitly asked.`,

  parameters: {
    type: "object",
    properties: {
      to: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } },
        ],
        description: "Recipient email(s). Max 50 total.",
      },
      subject: {
        type: "string",
        description: "Email subject line.",
      },
      body: {
        type: "string",
        description: "Plain-text body. Must end with your sign-off.",
      },
      html: {
        type: "string",
        description: "Optional HTML body. If provided, must include sign-off.",
      },
      cc: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } },
        ],
        description: "CC recipient(s). Set only if requested.",
      },
      bcc: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } },
        ],
        description: "BCC recipient(s). Set only if requested.",
      },
      replyTo: {
        type: "string",
        description: "Reply-to address. Set only if requested.",
      },
    },
    required: ["to", "subject", "body"],
  },

  execute: mailSender,
};
// --------------------
// Validation Helpers
// --------------------

function normalizeAddresses(input: string | string[] | undefined): string[] {
  if (!input) return [];
  return (Array.isArray(input) ? input : [input])
    .map((a) => a.trim())
    .filter(Boolean);
}

function assertValidEmail(address: string, field: string): void {
  if (!EMAIL_REGEX.test(address)) {
    throw new Error(`Invalid email address in '${field}': "${address}"`);
  }
}

function assertValidAddressList(addresses: string[], field: string): void {
  for (const addr of addresses) {
    assertValidEmail(addr, field);
  }
}

interface EmailCredentials {
  provider: "gmail" | "resend";
  gmailEmail?: string;
  gmailPassword?: string;
  resendApiKey?: string;
  resendEmail?: string;
}

async function loadEmailCredentials(userId: string): Promise<EmailCredentials> {
  try {
    const { Settings } = await import("@/server/db/models/settings-model");
    const connectDB = (await import("@/server/db/mongo")).default;
    await connectDB();

    const settings = (await Settings.findOne({ userId }).lean()) as any;
    
    // Fallback: If top-level email is empty, try to get from apiKeys (backward compatibility)
    const apiKeys = settings?.apiKeys || {};

    const { decrypt } = await import("@/server/utils/crypto");

    // Resolve Gmail
    const gmailEmail = settings?.gmailEmail || apiKeys["gmail_email"] || "";
    const rawGmailPass = apiKeys["gmail_app_password"] || "";
    const gmailPassword = rawGmailPass.startsWith("enc:")
      ? decrypt(rawGmailPass)
      : rawGmailPass;

    // Resolve Resend
    const resendEmail = settings?.resendEmail || apiKeys["resend_email"] || "";
    const rawResendKey = apiKeys["resend_api_key"] || "";
    const resendApiKey = rawResendKey.startsWith("enc:")
      ? decrypt(rawResendKey)
      : rawResendKey;

    return {
      provider: settings?.emailProvider || "gmail",
      gmailEmail,
      gmailPassword,
      resendEmail,
      resendApiKey,
    };
  } catch (err) {
    console.error(
      "[mailSenderTool] Could not load email credentials from DB:",
      err,
    );
    throw new Error(
      "Email configuration error. Please check your Connectivity settings.",
    );
  }
}

function assertAttachmentSizes(attachments: EmailAttachment[]): void {
  for (const att of attachments) {
    if (!att.content) continue;
    const bytes =
      att.content instanceof Buffer
        ? att.content.length
        : Buffer.byteLength(att.content as string, "base64");
    const mb = bytes / (1024 * 1024);
    if (mb > MAX_ATTACHMENT_SIZE_MB) {
      throw new Error(
        `Attachment "${att.filename}" is ${mb.toFixed(1)}MB — exceeds the ${MAX_ATTACHMENT_SIZE_MB}MB limit.`
      );
    }
  }
}

// --------------------
// Retry Helper
// --------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry: (attempt: number, err: Error) => void
): Promise<T> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // These errors will not resolve on retry — fail immediately
      const nonRetryable = [
        "invalid", "authentication", "credentials", "missing", "535", "534", 
        "unauthorized", "api_key", "configured", "not set", "invalid from field"
      ];
      const errorMsg = lastError.message.toLowerCase();
      if (
        nonRetryable.some((s) => errorMsg.includes(s)) ||
        attempt === RETRY_ATTEMPTS
      ) {
        throw lastError;
      }

      onRetry(attempt, lastError);
      await new Promise((res) =>
        setTimeout(res, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1))
      );
    }
  }

  throw lastError;
}

// --------------------
// Main Function
// --------------------

 async function mailSender(
  args: EmailArgs,
  sysOptions: SysOptions
): Promise<EmailResult> {
  const { userId, onStatusUpdate, signal } = sysOptions;
  const { to, subject, body, html, cc, bcc, replyTo, attachments = [] } = args;
  const timestamp = new Date().toISOString();

  try {
    // 1. Load credentials
    const creds = await loadEmailCredentials(userId);

    // 2. Validate recipients and content
    const toList = normalizeAddresses(to);
    const ccList = normalizeAddresses(cc);
    const bccList = normalizeAddresses(bcc);

    if (toList.length === 0) throw new Error("At least one 'to' address is required.");
    
    assertValidAddressList(toList, "to");
    assertValidAddressList(ccList, "cc");
    assertValidAddressList(bccList, "bcc");
    if (replyTo) assertValidEmail(replyTo, "replyTo");
    if (!subject?.trim()) throw new Error("Subject cannot be empty.");
    if (!body?.trim()) throw new Error("Body cannot be empty.");
    if (attachments.length > 0) assertAttachmentSizes(attachments);

    // 3. Sender Implementation
    if (creds.provider === "resend") {
      if (!creds.resendApiKey || !creds.resendEmail) {
        throw new Error("Resend is not fully configured. Please add your API Key and Verified Email in Settings.");
      }

      const fromAddress = `${APP_NAME} <${creds.resendEmail}>`;
      if (!creds.resendEmail.includes("@")) {
        throw new Error(`Invalid sender address (from): "${creds.resendEmail}". Format must be email@example.com`);
      }

      onStatusUpdate({ message: "Sending via Resend API..." });
      
      const { Resend } = await import("resend");
      const resendInstance = new Resend(creds.resendApiKey);

      const res = await withRetry(
        () => {
          if (signal?.aborted) throw new Error("AbortError");
          return resendInstance.emails.send({
            from: fromAddress,
            to: toList,
            cc: ccList.length > 0 ? ccList : undefined,
            bcc: bccList.length > 0 ? bccList : undefined,
            replyTo: replyTo ?? undefined,
            subject: subject.trim(),
            text: body,
            html: html ?? undefined,
            attachments: attachments.map(a => ({
              filename: a.filename,
              content: a.content as any,
            })),
          });
        },
        (attempt, err) => onStatusUpdate({ message: `Resend attempt ${attempt} failed: ${err.message}. Retrying...` })
      );

      if (res.error) throw new Error(res.error.message);

      onStatusUpdate({ message: "Email sent using Resend.", done: true });
      return {
        success: true,
        messageId: res.data?.id,
        timestamp,
      };

    } else {
      // GMAIL SMTP Fallback
      if (!creds.gmailEmail || !creds.gmailPassword) {
        throw new Error("Gmail is not configured. Please add your Credentials in Connectivity settings.");
      }

      const fromAddress = `${APP_NAME} <${creds.gmailEmail}>`;
      if (!creds.gmailEmail.includes("@")) {
        throw new Error(`Invalid sender address (from): "${creds.gmailEmail}". Format must be email@example.com`);
      }

      onStatusUpdate({ message: "Connecting to Gmail SMTP..." });
      
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: creds.gmailEmail,
          pass: creds.gmailPassword,
        },
      });

      const info = await withRetry(
        () => {
          if (signal?.aborted) throw new Error("AbortError");
          return transporter.sendMail({
            from: fromAddress,
            to: toList,
            cc: ccList.length > 0 ? ccList : undefined,
            bcc: bccList.length > 0 ? bccList : undefined,
            replyTo: replyTo ?? undefined,
            subject: subject.trim(),
            text: body,
            html: html ?? undefined,
            attachments: attachments.length > 0 ? attachments : undefined,
          });
        },
        (attempt, err) => onStatusUpdate({ message: `Gmail attempt ${attempt} failed: ${err.message}. Retrying...` })
      );

      onStatusUpdate({ message: "Email sent using Gmail.", done: true });
      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted as string[],
        rejected: info.rejected as string[],
        instructions: "The email has been successfully dispatched. Inform the user about the success and ask if they'd like to do anything else.",
        timestamp,
      };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    onStatusUpdate({ message: `Email failed: ${message}`, done: true });
    return {
      success: false,
      error: message,
      instructions: `The email failed to send: ${message}. Inform the user about the error.`,
      timestamp,
    };
  }
}