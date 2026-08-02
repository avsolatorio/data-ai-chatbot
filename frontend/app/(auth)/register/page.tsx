"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { authProvider } from "@/lib/auth/config";
import { getBasePath } from "@/lib/config";
import { isRegistrationDisabled } from "@/lib/auth/registration";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: "idle",
    }
  );

  // Register is for credentials-based auth. MSAL manages auth via the SDK, so
  // it must not render the form. Guest and user modes both show the form; the
  // form itself is provider-agnostic. See lib/auth/registration.ts.
  const registrationDisabled = isRegistrationDisabled(authProvider);
  useEffect(() => {
    if (registrationDisabled) {
      router.replace("/");
    }
  }, [registrationDisabled, router]);

  useEffect(() => {
    if (state.status === "user_exists") {
      toast({
        type: "error",
        description: state.message ?? "Account already exists!",
      });
      setIsSuccessful(false);
    } else if (state.status === "failed") {
      toast({
        type: "error",
        description: state.message ?? "Failed to create account!",
      });
      setIsSuccessful(false);
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Please check your email and password and try again.",
      });
      setIsSuccessful(false);
    } else if (state.status === "success") {
      toast({ type: "success", description: "Account created successfully!" });
      setIsSuccessful(true);
      // Redirect to chat page after successful registration
      setTimeout(() => {
        router.push("/");
      }, 500);
    }
  }, [state.status, state.message, router]);

  const showSignInHint =
    state.status === "user_exists" && Boolean(state.signInLink);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  if (registrationDisabled) {
    return null;
  }

  const basePath = getBasePath();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const guestHref = `${basePath}/api/auth/guest?redirectUrl=${encodeURIComponent(`${origin}${basePath}/`)}`;

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign Up</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
          {showSignInHint && (
            <p className="mt-4 text-center text-sm text-amber-600 dark:text-amber-400">
              <Link
                className="font-semibold underline"
                href="/login"
              >
                Sign in
              </Link>
              {" with your existing account instead."}
            </p>
          )}
          {authProvider === "guest" && (
            <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
              {"Or "}
              <Link
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
                href={guestHref}
              >
                continue as guest
              </Link>
              {" without an account."}
            </p>
          )}
          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/login"
            >
              Sign in
            </Link>
            {" instead."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
