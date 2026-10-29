import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import type { z } from "zod";
import { Button, Card, SelectField, TextField } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loginSchema, nullify, registerSchema } from "@/schemas";
import { SSMLogo } from "@/components/SSMLogo";

function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FCFBF7] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <Link to="/" className="hover:opacity-95 transition-opacity inline-block mb-3">
            <SSMLogo variant="auth" />

          </Link>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0B2A63] text-white text-xs font-bold tracking-wide uppercase shadow-xs border-r-3 border-[#F59E0B]">
            <span>SkillTrack Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          </div>
        </div>
        <Card className="p-6 border border-[#0B2A63]/15 bg-white shadow-md rounded-xl">
          <h1 className="text-xl font-bold text-[#0B2A63] tracking-tight">{title}</h1>
          <p className="mb-5 mt-1 text-sm text-slate-600">{subtitle}</p>
          {children}
        </Card>
        <p className="mt-4 text-center text-sm text-slate-600">{footer}</p>
      </div>
    </main>
  );
}
const home = (role: string) => (role === "admin" ? "/admin" : "/");

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  if (user) return <Navigate to={home(user.role)} replace />;

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try { const u = await login(v.email, v.password); navigate(from && u.role === "student" ? from : home(u.role), { replace: true }); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Could not sign in. Please try again."); }
  });
  return (
    <AuthFrame title="Sign in" subtitle="Use the email and password you registered with." footer={<>New student? <Link to="/register" className="font-semibold text-[#0B2A63] hover:text-[#D32F2F] hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Email" type="email" autoComplete="email" error={form.formState.errors.email} {...form.register("email")} />
        <TextField label="Password" type="password" autoComplete="current-password" error={form.formState.errors.password} {...form.register("password")} />
        {error && <p role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-[#D32F2F]">{error}</p>}
        <Button type="submit" className="w-full bg-[#0B2A63] hover:bg-[#061838] text-white font-semibold py-2.5 rounded-lg shadow-sm" loading={form.formState.isSubmitting}>Sign in</Button>
      </form>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { user, register: signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", register_number: "", department: "", year_of_study: "", password: "" },
  });
  if (user) return <Navigate to={home(user.role)} replace />;
  const e = form.formState.errors;

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    const body = nullify(v);
    if (body.year_of_study) body.year_of_study = Number(body.year_of_study);
    try {
      await signUp(body);
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        err.fieldErrors.forEach((fe) => {
          const n = String(fe.loc[fe.loc.length - 1]) as keyof typeof v;
          if (n in v) form.setError(n, { message: fe.msg });
        });
      } else {
        setError("Could not create the account. Please try again.");
      }
    }
  });

  return (
    <AuthFrame title="Create your student account" subtitle="Track skills, certificates, and placement readiness at SSMIET." footer={<>Already have an account? <Link to="/login" className="font-semibold text-[#0B2A63] hover:text-[#D32F2F] hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Full name" autoComplete="name" error={e.full_name} {...form.register("full_name")} />
        <TextField label="Email" type="email" autoComplete="email" error={e.email} {...form.register("email")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Register number (optional)" error={e.register_number} {...form.register("register_number")} />
          <SelectField label="Year of study (optional)" placeholder="Select" choices={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: `Year ${y}` }))} error={e.year_of_study} {...form.register("year_of_study")} />
        </div>
        <TextField label="Department (optional)" error={e.department} {...form.register("department")} />
        <TextField label="Password" type="password" autoComplete="new-password" hint="10-72 UTF-8 bytes, with a letter and a number." error={e.password} {...form.register("password")} />
        {error && <p role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-[#D32F2F]">{error}</p>}
        <Button type="submit" className="w-full bg-[#0B2A63] hover:bg-[#061838] text-white font-semibold py-2.5 rounded-lg shadow-sm" loading={form.formState.isSubmitting}>Create account</Button>
      </form>
    </AuthFrame>
  );
}
