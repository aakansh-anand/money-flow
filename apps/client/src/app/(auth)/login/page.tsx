import {
  AuthCardShell,
  AuthMotionItem,
  AuthPageFrame,
} from "@/features/auth/components/auth-motion";

const LoginPage = () => {
  return (
    <AuthPageFrame>
      <AuthCardShell>
        <AuthMotionItem>
          <h1 className="font-heading text-5xl font-semibold tracking-tight">Login to Kosh</h1>
        </AuthMotionItem>
        <AuthMotionItem>
          <p className="text-base text-muted-foreground mt-3">
            Enter your email below to login to Kosh
          </p>
        </AuthMotionItem>
      </AuthCardShell>
    </AuthPageFrame>
  );
};

export default LoginPage;
