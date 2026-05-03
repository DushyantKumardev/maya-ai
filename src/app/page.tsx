import { redirect } from "next/navigation";
import { auth } from "@/features/auth/config/auth";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/c");
  }

  redirect("/login");
}
