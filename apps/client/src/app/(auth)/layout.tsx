import { AuthGuestGuard } from "@/features/auth/components/auth-guest-guard";
import { AuthBrandMark, AuthPlusBackground } from "@/features/auth/components/auth-motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell relative flex min-h-screen items-center justify-center p-4">
      <AuthPlusBackground />
      <AuthBrandMark />
      <div className="relative z-10 flex w-full justify-center">
        <AuthGuestGuard>{children}</AuthGuestGuard>
      </div>
    </div>
  );
}
