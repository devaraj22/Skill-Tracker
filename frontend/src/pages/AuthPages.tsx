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

function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50/60 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center font-black tracking-tight text-sm shadow-xs mb-2">
            SSM
          </div>
          <p className="text-xl font-bold text-slate-900 tracking-tight">
            <span className="text-red-600">SSM</span> <span className="text-navy-900">SkillTrack</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 ml-1 align-middle" />
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            (An Autonomous Institution) · Palani Highway, Dindigul
          </p>
        </div>
        <Card className="p-6 border border-slate-200/90 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="mb-5 mt-1 text-sm text-slate-600">{subtitle}</p>
          {children}
        </Card>
        <p className="mt-4 text-center text-sm text-slate-600">{footer}</p>
      </div>
    </main>
  );
}
const home = (role: string) => (role === "admin" ? "/admin" : "/dashboard");

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
    <AuthFrame title="Sign in" subtitle="Use the email and password you registered with." footer={<>New student? <Link to="/register" className="font-medium text-brand-600">Create an account</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Email" type="email" autoComplete="email" error={form.formState.errors.email} {...form.register("email")} />
        <TextField label="Password" type="password" autoComplete="current-password" error={form.formState.errors.password} {...form.register("password")} />
        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>Sign in</Button>
      </form>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { user, register: signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema), defaultValues: { full_name: "", email: "", register_number: "", department: "", year_of_study: "", password: "" } });
  if (user) return <Navigate to={home(user.role)} replace />;
  const e = form.formState.errors;

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    const body = nullify(v);
    if (body.year_of_study) body.year_of_study = Number(body.year_of_study);
    try { await signUp(body); navigate("/", { replace: true }); }
    catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        err.fieldErrors.forEach((fe) => { const n = String(fe.loc[fe.loc.length - 1]) as keyof typeof v; if (n in v) form.setError(n, { message: fe.msg }); });
      } else setError("Could not create the account. Please try again.");
    }
  });
  return (
    <AuthFrame title="Create your student account" subtitle="Administrator accounts are created by your college, not here." footer={<>Already registered? <Link to="/login" className="font-medium text-brand-600">Sign in</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Full name" autoComplete="name" error={e.full_name} {...form.register("full_name")} />
        <TextField label="Email" type="email" autoComplete="email" error={e.email} {...form.register("email")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Register number (optional)" error={e.register_number} {...form.register("register_number")} />
          <SelectField label="Year of study (optional)" placeholder="Select" choices={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: `Year ${y}` }))} error={e.year_of_study} {...form.register("year_of_study")} />
        </div>
        <TextField label="Department (optional)" error={e.department} {...form.register("department")} />
        <TextField label="Password" type="password" autoComplete="new-password" hint="10-72 UTF-8 bytes, with a letter and a number." error={e.password} {...form.register("password")} />
        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>Create account</Button>
      </form>
    </AuthFrame>
  );
}
