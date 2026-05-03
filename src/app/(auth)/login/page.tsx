import Loader from "@/components/common/Loader";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { Suspense } from "react";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} | Login`,
  description: `Sign in to your ${APP_NAME} account to continue your conversations.`,
};

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-secondary px-4">
      <Suspense fallback={<Loader />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
