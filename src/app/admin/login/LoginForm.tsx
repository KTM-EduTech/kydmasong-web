"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { Button, TextInput } from "@/components/admin/ui";

/** Email + password sign-in, with a second step when two-factor (TOTP) is enabled. */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [factorId, setFactorId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const supabase = browserClient();

  // Full reload so the server reads the new session cookie.
  const done = () => window.location.assign(new URL("/admin", window.location.origin).toString());

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setError("Incorrect email or password.");
      return;
    }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (totp) {
        setFactorId(totp.id);
        setStep("mfa");
        setBusy(false);
        return;
      }
    }
    done();
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (error) {
      setBusy(false);
      setError("That code did not work. Try the latest code from your app.");
      return;
    }
    done();
  };

  return step === "password" ? (
    <form onSubmit={signIn} className="mt-6 space-y-4">
      <TextInput label="Email" type="email" value={email} onChange={setEmail} required />
      <TextInput label="Password" type="password" value={password} onChange={setPassword} required />
      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || !email || !password}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  ) : (
    <form onSubmit={verify} className="mt-6 space-y-4">
      <TextInput label="6-digit code from your authenticator app" value={code} onChange={setCode} required />
      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || code.trim().length < 6}>
        {busy ? "Checking…" : "Verify"}
      </Button>
    </form>
  );
}
