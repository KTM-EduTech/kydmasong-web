import { anonClient, isSupabaseConfigured } from "@/lib/supabase/clients";

/**
 * Called once a day by a scheduled job so the free Supabase project is never
 * paused for inactivity. Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Not authorised", { status: 401 });
  }
  if (!isSupabaseConfigured) return Response.json({ ok: false, reason: "not configured" });
  const { error } = await anonClient().from("site_settings").select("id").limit(1);
  return Response.json({ ok: !error, at: new Date().toISOString() });
}
