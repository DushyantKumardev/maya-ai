import { NextResponse } from "next/server";
import connectDB from "@/server/db/mongo";
import { resetPassword } from "@/features/auth/services/auth-service";
import User from "@/server/db/models/user-model";
import crypto from "crypto";
import { sendEmail } from "@/server/services/email-service";
import { APP_NAME } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const { email, password, token, action } = await req.json();

    await connectDB();

    if (action === "request") {
      // Step 1: Check if user exists
      if (!email) {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 },
        );
      }

      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { error: "No account found with this email" },
          { status: 404 },
        );
      }

      // Generate secure reset token and magic link dynamically matching the current host/IP
      const protocol = req.headers.get("x-forwarded-proto") || "http";
      const host = req.headers.get("host") || "localhost:3000";
      const requestUrl = `${protocol}://${host}`;

      const {
        magicLink,
        token: resetToken,
        expiresAt,
      } = generateMagicLink(
        { userId: user._id.toString(), email: user.email },
        requestUrl,
      );

      // Save token and expiry to the user
      user.resetToken = resetToken;
      user.resetTokenExpiry = expiresAt;
      await user.save();

      // Construct beautiful HTML recovery email
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f9fafb;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              width: 100%;
              background-color: #f9fafb;
              padding: 40px 20px;
              box-sizing: border-box;
            }
            .container {
              max-width: 570px;
              margin: 0 auto;
              background-color: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            }
            .header {
              background-color: #0f172a;
              padding: 30px 40px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              font-size: 24px;
              font-weight: 700;
              margin: 0;
              letter-spacing: -0.025em;
            }
            .content {
              padding: 40px;
            }
            .content p {
              color: #374151;
              font-size: 16px;
              line-height: 1.6;
              margin: 0 0 24px 0;
            }
            .btn-container {
              text-align: center;
              margin: 32px 0;
            }
            .btn {
              display: inline-block;
              background-color: #3b82f6;
              color: #ffffff !important;
              font-size: 16px;
              font-weight: 600;
              text-decoration: none;
              padding: 12px 32px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
            }
            .footer {
              background-color: #f9fafb;
              border-top: 1px solid #f3f4f6;
              padding: 24px 40px;
              text-align: center;
            }
            .footer p {
              color: #6b7280;
              font-size: 13px;
              line-height: 1.5;
              margin: 0 0 8px 0;
            }
            .footer a {
              color: #3b82f6;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>Maya AI</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset your password for your Maya AI account. You can reset your password instantly by clicking the secure button below:</p>
                <div class="btn-container">
                  <a href="${magicLink}" class="btn" style="color: #ffffff;">Reset Password</a>
                </div>
                <p>This secure magic link is valid for the next <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
                <p>Best regards,<br>The Maya AI Team</p>
              </div>
              <div class="footer">
                <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
                <p><a href="${magicLink}">${magicLink}</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailText = `Hello,\n\nWe received a request to reset your password for your ${APP_NAME} account. You can reset your password instantly by visiting the secure magic link below:\n\n${magicLink}\n\nThis magic link is valid for the next 10 minutes. If you did not request a password reset, you can safely ignore this email.\n\nBest regards,\nThe ${APP_NAME} Team`;

      // Dispatch the recovery email
      const mailResult = await sendEmail({
        to: user.email,
        subject: `Reset your ${APP_NAME} password`,
        html: emailHtml,
        text: emailText,
      });

      return NextResponse.json(
        {
          message: mailResult.success
            ? "Recovery email sent successfully"
            : "Verification step initiated",
          magicLink,
          token: resetToken,
        },
        { status: 200 },
      );
    }

    if (action === "verify") {
      if (!email || !token) {
        return NextResponse.json(
          { error: "Email and token are required" },
          { status: 400 },
        );
      }

      const user = await User.findOne({ email });
      if (
        !user ||
        user.resetToken !== token ||
        !user.resetTokenExpiry ||
        user.resetTokenExpiry < new Date()
      ) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { message: "Token verified successfully" },
        { status: 200 },
      );
    }

    if (action === "reset") {
      // Step 3: Perform actual reset
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 },
        );
      }

      // Securely check token if provided in payload
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (token) {
        if (
          user.resetToken !== token ||
          !user.resetTokenExpiry ||
          user.resetTokenExpiry < new Date()
        ) {
          return NextResponse.json(
            { error: "Invalid or expired token" },
            { status: 400 },
          );
        }
      }

      await resetPassword(email, password);

      // Clear reset token and expiry
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();

      return NextResponse.json(
        { message: "Password updated successfully" },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

interface MagicLinkPayload {
  userId: string;
  email: string;
}

interface AuthToken {
  uuid: string;
  expiresAt: Date;
}

function generateAuthToken(): AuthToken {
  const uuid = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  return { uuid, expiresAt };
}

function generateMagicLink(
  { email }: MagicLinkPayload,
  customAppUrl?: string,
): { magicLink: string; token: string; expiresAt: Date } {
  const { uuid: token, expiresAt } = generateAuthToken();
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Prioritize production NEXT_PUBLIC_APP_URL as the absolute source of truth.
  // Fallback to dynamic request host URL for local development/IP/mobile testing.
  const appUrl =
    configuredUrl && !configuredUrl.includes("localhost")
      ? configuredUrl
      : customAppUrl || configuredUrl || "http://localhost:3000";

  const magicLink = `${appUrl}/forgot-password?token=${token}&email=${encodeURIComponent(email)}`;
  return { magicLink, token, expiresAt };
}
