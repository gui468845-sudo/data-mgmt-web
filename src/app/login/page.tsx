import { LoginForm } from "@/components/auth/login-form";

export const instant = false;

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          Data Mgmt
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with the same email and password as the phone app.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
