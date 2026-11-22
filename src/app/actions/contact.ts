"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { anonClient, isSupabaseConfigured } from "@/lib/supabase/clients";
import { getSettings } from "@/lib/data";

export type ContactState = {
  ok: boolean;
  message: string;
  errors?: Partial<Record<"full_name" | "email" | "enquiry_type" | "subject" | "message" | "consent", string>>;
  values?: Record<string, string>;
};

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name.").max(120, "Name is too long."),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  enquiry_type: z.string().trim().min(1, "Please choose an enquiry type."),
  subject: z.string().trim().max(200, "Subject is too long.").optional(),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(5000, "Message is too long (5000 characters max)."),
  consent: z.literal("on", { message: "Please confirm you agree to the privacy policy." }),
});

// In-memory burst limiter per IP (per server instance). The database also
// enforces max 3 enquiries per email per 10 minutes.
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Turnstile not configured: honeypot + rate limits still apply.
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      cache: "no-store",
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: real people never fill this hidden field.
  if (String(formData.get("company_website") ?? "").length > 0) {
    return { ok: true, message: "Thank you. Your message has been sent." };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return { ok: false, message: "Too many messages. Please try again in a few minutes." };

  const raw = {
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    enquiry_type: formData.get("enquiry_type"),
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
    consent: formData.get("consent"),
  };
  const values = Object.fromEntries(
    ["full_name", "email", "enquiry_type", "subject", "message"].map((k) => [k, String(formData.get(k) ?? "").slice(0, 5000)]),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const errors: ContactState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof NonNullable<ContactState["errors"]>;
      errors[k] ??= issue.message;
    }
    return { ok: false, message: "Please check the highlighted fields.", errors, values };
  }

  const settings = await getSettings();
  if (!settings.enquiry_types.includes(parsed.data.enquiry_type)) {
    return { ok: false, message: "Please check the highlighted fields.", errors: { enquiry_type: "Please choose an enquiry type." }, values };
  }

  if (!(await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip))) {
    return { ok: false, message: "The spam check failed. Please try again.", values };
  }

  if (!isSupabaseConfigured) return { ok: false, message: "The form is not connected yet. Please email instead." };

  const { error } = await anonClient().from("contact_submissions").insert({
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    enquiry_type: parsed.data.enquiry_type,
    subject: parsed.data.subject || null,
    message: parsed.data.message,
    consent: true,
  });
  if (error) {
    // RLS rejects when the per-email rate limit is hit.
    return { ok: false, message: "Your message could not be sent. Please wait a few minutes or email directly.", values };
  }
  return { ok: true, message: "Thank you. Your message has been sent, and I will reply as soon as I can." };
}
