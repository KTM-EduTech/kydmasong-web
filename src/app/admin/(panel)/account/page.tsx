import { requireAdmin } from "@/lib/auth";
import { AccountSecurity } from "./AccountSecurity";

export const metadata = { title: "Account & security" };

export default async function AccountPage() {
  const { email } = await requireAdmin();
  return <AccountSecurity email={email} />;
}
