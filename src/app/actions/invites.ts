"use server";
import { unstable_rethrow } from "next/navigation";
import { workspace, services } from "@/lib/server";
import { safeError } from "@/lib/workspace";
import { sendEmail, inviteEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
async function deliver(email: string, role: string, token: string) {
  const { env } = await services();
  const base = env.BETTER_AUTH_URL;
  if (!base) throw new Error("App URL is not configured.");
  const link = base.replace(/\/$/, "") + "/accept-invite?token=" + token;
  const tmpl = inviteEmail("your company", role, link);
  const sent = await sendEmail(email, tmpl.subject, tmpl.html, env);
  return { link, delivered: sent.delivered };
}
export async function createInvite(email: string, role: string) {
  try {
    const ws = await workspace();
    const { token } = await ws.createInvite(email, role);
    const sent = await deliver(email, role, token);
    revalidatePath("/members");
    return { success: true, ...sent };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
export async function revokeInvite(id: string) {
  try {
    await (await workspace()).revokeInvite(id);
    revalidatePath("/members");
    return { success: true };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
export async function resendInvite(id: string) {
  try {
    const row = await (await workspace()).resendInvite(id);
    const sent = await deliver(row.email, row.role, row.token);
    revalidatePath("/members");
    return { success: true, ...sent };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
export async function acceptInvite(token: string) {
  try {
    await (await workspace()).acceptInvite(token);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
