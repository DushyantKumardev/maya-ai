import Loader from "@/components/common/Loader";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <div className="w-full flex items-center justify-center">
      <Suspense fallback={<Loader />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
