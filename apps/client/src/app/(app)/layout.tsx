import { AuthRequiredGuard } from "@/features/auth/components/auth-required-guard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthRequiredGuard>{children}</AuthRequiredGuard>;
}
