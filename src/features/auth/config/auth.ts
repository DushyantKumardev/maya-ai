import NextAuth from "next-auth";
import { authConfig } from "./auth-config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import connectDB from "@/server/db/mongo";
import User from "@/server/db/models/user-model";

async function getUser(email: string): Promise<any> {
  try {
    await connectDB();
    const user = await User.findOne({ email }).select("+password");
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch)
            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              image: user.image,
            };
        }
        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
