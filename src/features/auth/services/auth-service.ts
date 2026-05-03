import bcrypt from "bcryptjs";
import User from "@/server/db/models/user-model";

/**
 * Registers a new user with hashed password.
 *
 * @param data - The registration payload containing name, email, and password.
 * @returns The newly created sanitized user object.
 * @throws Error if the user already exists.
 */
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  return sanitizeUser(user);
}

/**
 * Validates a user's credentials against the database.
 *
 * @param email - The user's email address.
 * @param password - The plaintext password to check.
 * @returns The sanitized user object if credentials are and valid, or null otherwise.
 */
export async function validateCredentials(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password!);
  if (!isValid) return null;

  return sanitizeUser(user);
}

/**
 * Resets a user's password.
 *
 * @param email - The user's email address.
 * @param newPassword - The new plaintext password to set.
 * @returns The sanitized user object.
 * @throws Error if the user is not found.
 */
export async function resetPassword(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  await user.save();

  return sanitizeUser(user);
}

function sanitizeUser(user: any) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}
