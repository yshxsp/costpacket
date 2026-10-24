"use server";
import { services } from "@/lib/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
export async function logout() {
  const response = await (
    await services()
  ).auth.api.signOut({ headers: await headers(), asResponse: true });
  const jar = await cookies();
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const name = pair.slice(0, pair.indexOf("="));
    jar.set(name, "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: name.startsWith("__Secure-"),
      sameSite: "lax",
    });
  }
  redirect("/");
}
