import { AppShell } from "@/components/app-shell/app-shell";
import { AuthRequiredGuard } from "@/features/auth/components/auth-required-guard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthRequiredGuard>
      <AppShell>{children}</AppShell>
    </AuthRequiredGuard>
  );
}
