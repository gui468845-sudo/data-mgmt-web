import { RegisterForm } from "@/components/auth/register-form";

export const instant = false;

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          Create account
        </h1>
        <p className="mt-2 text-sm text-muted">
          New accounts sync with the same Supabase project as the phone app.
        </p>
        <div className="mt-8">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
