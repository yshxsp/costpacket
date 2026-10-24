import { services } from "@/lib/server";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  try {
    return await (await services()).auth.handler(request);
  } catch (e) {
    console.error("Authentication request failed", {
      name: e instanceof Error ? e.name : "unknown",
    });
    return Response.json(
      { message: "Authentication is temporarily unavailable. Please retry." },
      { status: 503 },
    );
  }
}
export async function GET(request: Request) {
  return handle(request);
}
export async function POST(request: Request) {
  return handle(request);
}
