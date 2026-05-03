import { NextResponse } from "next/server";
import connectDB from "@/server/db/mongo";
import { resetPassword } from "@/features/auth/services/auth-service";
import User from "@/server/db/models/user-model";

export async function POST(req: Request) {
  try {
    const { email, password, action } = await req.json();

    await connectDB();

    if (action === "request") {
      // Step 1: Check if user exists
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
      }

      // Here is where the "magic" would happen (e.g., sending OTP/Link)
      // For now, we just return success
      return NextResponse.json({ message: "Verification step initiated" }, { status: 200 });
    }

    if (action === "reset") {
      // Step 3: Perform actual reset
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      await resetPassword(email, password);
      return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Internal Server Error",
    },
    { status: 500 }
  );
}
}
