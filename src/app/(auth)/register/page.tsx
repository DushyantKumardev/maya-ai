import Loader from "@/components/common/Loader";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-secondary px-4">
      <Suspense fallback={<Loader />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
