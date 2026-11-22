import type { Metadata } from "next";
import { ConfirmProvider, ToastProvider } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · KTM EduTech" },
  robots: { index: false, follow: false },
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
