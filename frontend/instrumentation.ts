import { registerOTel } from "@vercel/otel";
import { validateEnv } from "@/lib/env";

export function register() {
  // Validate env on server startup; fail fast if invalid
  validateEnv();
  registerOTel({ serviceName: "ai-chatbot" });
}
