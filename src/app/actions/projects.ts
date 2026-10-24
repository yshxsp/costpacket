"use server";
import { unstable_rethrow } from "next/navigation";
import { workspace } from "@/lib/server";
import { safeError } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export async function deleteProject(id: string) {
  try {
    await (await workspace()).deleteProject(id);
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
  revalidatePath("/projects");
  redirect("/projects");
}
export async function updateProjectStatus(id: string, status: string) {
  try {
    await (await workspace()).updateProject(id, status);
    revalidatePath("/projects");
    return { success: true };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
export async function updateTaskStatus(id: string, status: string) {
  try {
    await (await workspace()).updateTask(id, status);
    revalidatePath("/tasks");
    revalidatePath("/tasks/" + id);
    return { success: true };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
