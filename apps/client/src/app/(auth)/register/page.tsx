import {
  AuthAnimatedLink,
  AuthCardShell,
  AuthMotionItem,
  AuthPageFrame,
} from "@/features/auth/components/auth-motion";
import RegisterForm from "@/features/auth/components/register-form";

const RegisterPage = () => {
  return (
    <AuthPageFrame>
      <AuthCardShell>
        <AuthMotionItem>
          <h1 className="font-heading text-5xl font-semibold tracking-tight">Register to Kosh</h1>
        </AuthMotionItem>
        <AuthMotionItem>
          <p className="text-base text-muted-foreground mt-3">
            Enter your email below to register to Kosh
          </p>
        </AuthMotionItem>
        <RegisterForm />
        <AuthMotionItem className="mt-6 text-base text-muted-foreground">
          Already a user? <AuthAnimatedLink href="/login">Login</AuthAnimatedLink>
        </AuthMotionItem>
      </AuthCardShell>
    </AuthPageFrame>
  );
};

export default RegisterPage;
