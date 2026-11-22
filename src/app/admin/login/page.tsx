import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  const s = await getSettings();
  return (
    <main className="grid min-h-screen place-items-center bg-navy p-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          {s.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logo_url} alt={s.logo_alt} className="h-12 w-auto" />
          ) : (
            <p className="text-2xl font-semibold text-white">{s.site_name}</p>
          )}
        </div>
        <div className="rounded-2xl bg-surface p-7 shadow-2xl">
          <h1 className="text-xl font-semibold">Sign in to the dashboard</h1>
          <p className="mt-1 text-sm text-muted">Administrators only.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
