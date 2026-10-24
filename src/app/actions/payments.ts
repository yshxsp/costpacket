"use server";
import { unstable_rethrow } from "next/navigation";
import { workspace } from "@/lib/server";
import { safeError } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
export async function createPayment(id: string) {
  try {
    await (await workspace()).createPayment(id);
    revalidatePath("/payments");
    revalidatePath("/tasks/" + id);
    return { success: true, status: "PENDING" };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
export async function markPayoutPaid(
  id: string,
  reference?: string,
  note?: string,
) {
  try {
    const status = await (
      await workspace()
    ).transitionPayment(id, "MARKED_PAID", reference, note);
    revalidatePath("/payments");
    return { success: true, status };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
export async function cancelPayout(id: string, note?: string) {
  try {
    const status = await (
      await workspace()
    ).transitionPayment(id, "CANCELED", undefined, note);
    revalidatePath("/payments");
    return { success: true, status };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
