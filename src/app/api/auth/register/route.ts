import { NextResponse } from "next/server";
import connectDB from "@/server/db/mongo";
import { registerUser } from "@/features/auth/services/auth-service";

/**
 * Registers a new user.
 *
 * Validates the incoming request body for required fields (name, email, password),
 * creates a new user via the auth service, and returns the result.
 *
 * @param req - The incoming HTTP request containing user registration details.
 * @returns A JSON response with the created user data or an error payload.
 */
export async function POST(req: Request) {
  try {
    // Extract name, email, and password from request body
    const { name, email, password } = await req.json();

    // Validate that all required fields are present
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await registerUser({ name, email, password });
    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 },
    );
  } catch (error: unknown) {
    // Return error response
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal Server Error",
      },
      {
        status: error instanceof Error && error.message === "User already exists"
          ? 400
          : 500,
      },
    );
  }
}
