"use server";
import { unstable_rethrow } from "next/navigation";
import { workspace, services } from "@/lib/server";
import { headers } from "next/headers";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { safeError } from "@/lib/workspace";
import { z } from "zod";
import { revalidatePath } from "next/cache";
export async function updateProfile(form: FormData) {
  try {
    const ws = await workspace();
    const name = z.string().trim().min(1).max(200).parse(form.get("name"));
    await (
      await services()
    ).auth.api.updateUser({ headers: await headers(), body: { name } });
    await ws.db
      .update(profiles)
      .set({ name })
      .where(eq(profiles.id, ws.user.id));
    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
