"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useContext, useEffect, useState } from "react";

import { MsalInstanceContext } from "@/components/auth/msal/msal-provider-wrapper";
import { AuthForm } from "@/components/auth-form";
import { LoaderIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { authProvider } from "@/lib/auth/config";
import { loginRequest } from "@/lib/auth/msal/msal-config";
import { type LoginActionState, login } from "../actions";

export default function Page() {
  const router = useRouter();
  const msalInstance = useContext(MsalInstanceContext);

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);
  const [isMsalRedirecting, setIsMsalRedirecting] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    },
  );

  useEffect(() => {
    if (state.status === "failed") {
      toast({
        type: "error",
        description: "Invalid credentials!",
      });
      setIsSuccessful(false);
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
      setIsSuccessful(false);
    } else if (state.status === "success") {
      setIsSuccessful(true);
      setTimeout(() => {
        router.push("/");
      }, 500);
    }
  }, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  const handleTryAsGuest = async () => {
    if (isCreatingGuest) {
      return;
    }

    setIsCreatingGuest(true);

    try {
      window.location.href = `/api/auth/guest?redirectUrl=${encodeURIComponent(`${window.location.origin}/`)}`;
    } catch (error) {
      console.error("Error creating guest session:", error);
      toast({
        type: "error",
        description: "Failed to start guest session. Please try again.",
      });
      setIsCreatingGuest(false);
    }
  };

  const handleLoginWithMsal = async () => {
    if (!msalInstance || isMsalRedirecting) return;
    setIsMsalRedirecting(true);
    try {
      await msalInstance.loginRedirect(loginRequest);
    } catch {
      toast({
        type: "error",
        description: "Failed to start sign in. Please try again.",
      });
      setIsMsalRedirecting(false);
    }
  };

  if (authProvider === "msal") {
    return (
      <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
        <div className="flex w-full max-w-md flex-col gap-8 overflow-hidden rounded-2xl px-4 sm:px-16">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <h3 className="font-semibold text-xl dark:text-zinc-50">Sign In</h3>
            <p className="text-gray-500 text-sm dark:text-zinc-400">
              Sign in with your organization account
            </p>
          </div>
          <Button
            type="button"
            onClick={handleLoginWithMsal}
            disabled={isMsalRedirecting}
            className="w-full"
          >
            {isMsalRedirecting ? (
              <>
                <span className="mr-2 animate-spin">
                  <LoaderIcon />
                </span>
                Redirecting to sign in...
              </>
            ) : (
              "Login with MSAL"
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (authProvider === "guest") {
    return (
      <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
        <div className="flex w-full max-w-md flex-col gap-8 overflow-hidden rounded-2xl px-4 sm:px-16">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <h3 className="font-semibold text-xl dark:text-zinc-50">Sign In</h3>
            <p className="text-gray-500 text-sm dark:text-zinc-400">
              Continue as guest to get started
            </p>
          </div>
          <Button
            type="button"
            onClick={handleTryAsGuest}
            disabled={isCreatingGuest}
            className="w-full"
          >
            {isCreatingGuest ? (
              <>
                <span className="mr-2 animate-spin">
                  <LoaderIcon />
                </span>
                Creating guest session...
              </>
            ) : (
              "Try as guest"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign In</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-center text-gray-600 text-sm dark:text-zinc-400">
              {"Don't have an account? "}
              <Link
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
                href="/register"
              >
                Sign up
              </Link>
              {" for free."}
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-gray-500 dark:text-zinc-400">
                  Or
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleTryAsGuest}
              disabled={isCreatingGuest || isSuccessful}
              className="w-full"
            >
              {isCreatingGuest ? (
                <>
                  <span className="mr-2 animate-spin">
                    <LoaderIcon />
                  </span>
                  Creating guest session...
                </>
              ) : (
                "Try as guest"
              )}
            </Button>
          </div>
        </AuthForm>
      </div>
    </div>
  );
}
