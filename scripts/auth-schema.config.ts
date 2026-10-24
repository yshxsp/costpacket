import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
export const auth = betterAuth({
  database: drizzleAdapter({}, { provider: "pg", schemaName: "costpacket" }),
  emailAndPassword: { enabled: true },
  rateLimit: { enabled: true, storage: "database" },
});
