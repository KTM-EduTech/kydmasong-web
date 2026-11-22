import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";

/** Admin-only: turn on draft mode and open the requested path. */
export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) return new Response("Not authorised", { status: 401 });
  const target = new URL(request.url).searchParams.get("path") ?? "/";
  // Only allow same-site relative paths.
  const safe = target.startsWith("/") && !target.startsWith("//") ? target : "/";
  (await draftMode()).enable();
  redirect(safe);
}
