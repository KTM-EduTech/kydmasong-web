"use client";
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";
import { Button, Card, PageHeading, TextInput, useConfirm, useToast } from "@/components/admin/ui";

type Factor = { id: string; friendly_name?: string; status: string };

export function AccountSecurity({ email }: { email: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const supabase = browserClient();
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");

  const load = useCallback(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => setFactors((data?.totp ?? []) as Factor[]));
  }, [supabase]);
  useEffect(load, [load]);

  const changePassword = async () => {
    if (pw.next.length < 12) return toast("error", "Use at least 12 characters.");
    if (pw.next !== pw.confirm) return toast("error", "The passwords do not match.");
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) return toast("error", error.message);
    setPw({ next: "", confirm: "" });
    toast("ok", "Password changed");
  };

  const startEnroll = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` });
    if (error) return toast("error", error.message);
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const verifyEnroll = async () => {
    if (!enroll) return;
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.trim() });
    if (error) return toast("error", "That code did not work. Try the newest code.");
    setEnroll(null);
    setCode("");
    toast("ok", "Two-factor sign-in is on.");
    load();
  };

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <>
      <PageHeading title="Account & security" description={`Signed in as ${email}`} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Change password">
          <TextInput label="New password" type="password" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} help="At least 12 characters." />
          <TextInput label="Confirm new password" type="password" value={pw.confirm} onChange={(v) => setPw({ ...pw, confirm: v })} />
          <Button onClick={changePassword} disabled={!pw.next}>
            Change password
          </Button>
        </Card>
        <Card title="Two-factor sign-in (recommended)">
          {verified.length > 0 ? (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800 [[data-theme=dark]_&]:text-emerald-300">
                <ShieldCheck size={18} /> On: a code from your authenticator app is required at sign-in.
              </p>
              {verified.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                  {f.friendly_name ?? "Authenticator app"}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (!(await confirm({ title: "Turn off two-factor?", body: "Your account will be protected by your password only.", confirmLabel: "Turn off", danger: true }))) return;
                      const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id });
                      if (error) return toast("error", error.message);
                      toast("ok", "Two-factor turned off");
                      load();
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </>
          ) : enroll ? (
            <div className="space-y-4">
              <p className="text-sm">Scan this QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…), then enter the 6-digit code.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enroll.qr} alt="QR code for your authenticator app" className="h-44 w-44 rounded-lg bg-white p-2" />
              <p className="break-all text-xs text-muted">Or enter this key manually: {enroll.secret}</p>
              <TextInput label="6-digit code" value={code} onChange={setCode} />
              <Button onClick={verifyEnroll} disabled={code.trim().length < 6}>
                Verify and turn on
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">Adds a one-time code from your phone to every sign-in.</p>
              <Button onClick={startEnroll}>Set up two-factor</Button>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
