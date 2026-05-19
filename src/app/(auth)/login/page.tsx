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
    <div className="w-full flex items-center justify-center">
      <Suspense fallback={<Loader />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
