"use client";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient();
export function safeReturnPath(value: string | null) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\r\n]/.test(value)
    ? value
    : "/dashboard";
}
