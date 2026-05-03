import Loader from "@/components/common/Loader";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { Suspense } from "react";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} | Forgot Password`,
  description: `Reset your ${APP_NAME} account password.`,
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-secondary px-4">
      <Suspense fallback={<Loader />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
