"use server";

import { z } from "zod";

import {
  AuthError,
  createGuest,
  login as authLogin,
  register as authRegister,
} from "@/lib/auth-service";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password cannot exceed 72 characters")
    .refine(
      (password) => {
        // Check UTF-8 byte length (bcrypt limit is 72 bytes)
        // Most ASCII characters are 1 byte, but emojis/special chars can be 2-4 bytes
        const byteLength = new TextEncoder().encode(password).length;
        return byteLength <= 72;
      },
      {
        message:
          "Password is too long when encoded (max 72 bytes). Try a shorter password or avoid special characters.",
      }
    ),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  message?: string;
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    try {
      await authLogin(validatedData.email, validatedData.password);
      return { status: "success" };
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          status: "failed",
          message: error.status === 429
            ? "Too many attempts. Please wait a moment and try again."
            : error.message,
        };
      }
      console.error("Login error:", error);
      return { status: "failed" };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
  message?: string;
  signInLink?: boolean;
};

const RATE_LIMIT_MESSAGE = "Too many attempts. Please wait a moment and try again.";

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    try {
      await authRegister(validatedData.email, validatedData.password);
      return { status: "success" };
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.signInHint) {
          return {
            status: "user_exists",
            message: "This email is already registered. Try logging in.",
            signInLink: true,
          };
        }
        if (error.status === 429) {
          return { status: "failed", message: RATE_LIMIT_MESSAGE };
        }
        return { status: "failed", message: error.message };
      }
      console.error("Registration error:", error);
      return { status: "failed" };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }
};
