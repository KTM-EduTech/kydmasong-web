"use client";
import Script from "next/script";
import { useActionState } from "react";
import { Send } from "lucide-react";
import { submitContact, type ContactState } from "@/app/actions/contact";

const initial: ContactState = { ok: false, message: "" };

function Field({ id, label, error, children, optional }: { id: string; label: string; error?: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-red-700 [[data-theme=dark]_&]:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

const input =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[16px] text-ink placeholder:text-muted/70 transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-gold";

export function ContactForm({ enquiryTypes, privacyUrl, turnstileSiteKey }: { enquiryTypes: string[]; privacyUrl: string; turnstileSiteKey: string }) {
  const [state, action, pending] = useActionState(submitContact, initial);
  const e = state.errors ?? {};
  const v = state.values ?? {};
  if (state.ok) {
    return (
      <div role="status" className="rounded-[1.75rem] bg-gold p-10 text-navy">
        <p className="text-2xl font-semibold">Message sent</p>
        <p className="mt-2">{state.message}</p>
      </div>
    );
  }
  const describedBy = (k: keyof typeof e) => (e[k] ? `${k}-error` : undefined);
  return (
    <form key={JSON.stringify(v)} action={action} noValidate className="space-y-5 rounded-[1.75rem] border border-line bg-surface p-7 md:p-9">
      {turnstileSiteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}
      {state.message && !state.ok && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {state.message}
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="full_name" label="Full name" error={e.full_name}>
          <input id="full_name" name="full_name" defaultValue={v.full_name} autoComplete="name" required maxLength={120} className={input} aria-invalid={!!e.full_name} aria-describedby={describedBy("full_name")} />
        </Field>
        <Field id="email" label="Email address" error={e.email}>
          <input id="email" name="email" defaultValue={v.email} type="email" autoComplete="email" required maxLength={200} className={input} aria-invalid={!!e.email} aria-describedby={describedBy("email")} />
        </Field>
      </div>
      <Field id="enquiry_type" label="Enquiry type" error={e.enquiry_type}>
        <select id="enquiry_type" name="enquiry_type" required defaultValue={v.enquiry_type ?? ""} className={input} aria-invalid={!!e.enquiry_type} aria-describedby={describedBy("enquiry_type")}>
          <option value="" disabled>
            Choose one…
          </option>
          {enquiryTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field id="subject" label="Subject" optional error={e.subject}>
        <input id="subject" name="subject" defaultValue={v.subject} maxLength={200} className={input} aria-invalid={!!e.subject} aria-describedby={describedBy("subject")} />
      </Field>
      <Field id="message" label="Message" error={e.message}>
        <textarea id="message" name="message" defaultValue={v.message} required minLength={10} maxLength={5000} rows={6} className={input} aria-invalid={!!e.message} aria-describedby={describedBy("message")} />
      </Field>
      {/* Honeypot */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Company website
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div>
        <label className="flex items-start gap-3 text-[15px]">
          <input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-[#232450]" aria-invalid={!!e.consent} aria-describedby={describedBy("consent")} />
          <span>
            I agree that my details will be stored to reply to this enquiry, as described in the{" "}
            {privacyUrl ? (
              <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="link-underline font-semibold">
                Privacy Policy
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              "Privacy Policy"
            )}
            .
          </span>
        </label>
        {e.consent && (
          <p id="consent-error" className="mt-1.5 text-sm font-medium text-red-700 [[data-theme=dark]_&]:text-red-300">
            {e.consent}
          </p>
        )}
      </div>
      {turnstileSiteKey && <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="auto" />}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-semibold text-navy transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-gold/30 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"} <Send size={17} aria-hidden />
      </button>
    </form>
  );
}
