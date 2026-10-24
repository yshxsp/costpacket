"use server";
import { unstable_rethrow } from "next/navigation";
import { workspace } from "@/lib/server";
import { safeError } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
export async function createProject(input: unknown) {
  try {
    const row = await (await workspace()).createProject(input);
    revalidatePath("/projects");
    return { success: true, id: row.id };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
export async function createTask(input: unknown) {
  try {
    const row = await (await workspace()).createTask(input);
    revalidatePath("/tasks");
    revalidatePath("/projects/" + row.project_id);
    return { success: true, id: row.id };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
export async function createExpense(input: unknown) {
  try {
    const row = await (await workspace()).createExpense(input);
    revalidatePath("/expenses");
    return { success: true, id: row.id };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
export async function loadExpenseTasks() {
  const ws = await workspace();
  return (await ws.listTasks()).map((t) => ({ id: t.id, title: t.title }));
}
