import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { Db } from "./db/client";
import * as schema from "./db/auth.generated";
import type { RuntimeEnv } from "./runtime";
import { sendEmail } from "./email";
export function createAuth(db: Db, env: RuntimeEnv) {
  const secret = env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  const baseURL = env.BETTER_AUTH_URL;
  if (!baseURL) throw new Error("BETTER_AUTH_URL is required.");
  const secure = new URL(baseURL).protocol === "https:";
  if (!secure && env.COSTPACKET_LOCAL !== "1")
    throw new Error("Production authentication requires HTTPS.");
  return betterAuth({
    appName: "CostPacket",
    baseURL,
    secret,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
      schemaName: "costpacket",
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      sendResetPassword: async ({ user, url }) => {
        const result = await sendEmail(
          user.email,
          "Reset your CostPacket password",
          `<p><a href="${url.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}">Reset password</a></p>`,
          env,
        );
        if (!result.delivered)
          throw new Error("Password reset email unavailable.");
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(
          user.email,
          "Verify your CostPacket email",
          `<p><a href="${url.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}">Verify email</a></p>`,
          env,
        );
      },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      useSecureCookies: secure,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure },
    },
    logger: {
      level: "warn",
      log: (level, message) =>
        console.warn("Authentication service", { level, message }),
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 8 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
  });
}
