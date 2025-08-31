import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
