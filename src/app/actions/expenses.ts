"use server";
import { unstable_rethrow } from "next/navigation";
import { workspace } from "@/lib/server";
import { safeError } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
export async function updateExpenseStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
) {
  try {
    await (await workspace()).reviewExpense(id, status);
    revalidatePath("/expenses");
    return { success: true };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
