import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Card, DataState, PageHeader, ProgressBar, SelectField, TextAreaField, TextField, useToast } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { nullify, profileSchema } from "@/schemas";
import type { Profile } from "@/types";

type Values = { full_name: string; register_number: string; department: string; year_of_study: string; avatar_url: string; bio: string; github_url: string; linkedin_url: string; resume_url: string };

export function ProfilePage() {
  const qc = useQueryClient(); const toast = useToast();
  const query = useQuery({ queryKey: ["profile"], queryFn: () => api.get<Profile>("/students/me") });
  const form = useForm<Values>({ resolver: zodResolver(profileSchema) });
  const p = query.data;
  useEffect(() => {
    if (p) form.reset({ full_name: p.full_name, register_number: p.register_number ?? "", department: p.department ?? "", year_of_study: p.year_of_study ? String(p.year_of_study) : "", avatar_url: p.avatar_url ?? "", bio: p.bio ?? "", github_url: p.github_url ?? "", linkedin_url: p.linkedin_url ?? "", resume_url: p.resume_url ?? "" });
  }, [p, form]);

  const save = useMutation({
    mutationFn: (v: Values) => {
      const body = nullify(v);
      if (p?.register_number) delete body.register_number; // only an administrator can change it
      body.year_of_study = v.year_of_study ? Number(v.year_of_study) : null;
      return api.patch<Profile>("/students/me", body);
    },
    onSuccess: (data) => { qc.setQueryData(["profile"], data); void qc.invalidateQueries({ queryKey: ["dashboard"] }); void qc.invalidateQueries({ queryKey: ["me"] }); toast("success", "Profile saved"); },
    onError: (e) => { toast("error", e.message); if (e instanceof ApiError) e.fieldErrors.forEach((fe) => { const n = String(fe.loc[fe.loc.length - 1]) as keyof Values; if (n in form.getValues()) form.setError(n, { message: fe.msg }); }); },
  });
  const e = form.formState.errors;

  return (
    <>
      <PageHeader title="Profile" description="Your email and register number are private. They never appear on your public portfolio." />
      <DataState query={query}>
        {(prof) => (
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <Card className="space-y-4">
              <TextField label="Full name" error={e.full_name} {...form.register("full_name")} />
              <TextField label="Email" value={prof.email} readOnly hint="Contact your administrator to change your email." />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Register number" readOnly={!!prof.register_number} hint={prof.register_number ? "Only an administrator can change this." : undefined} error={e.register_number} {...form.register("register_number")} />
                <SelectField label="Year of study" placeholder="Select" choices={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: `Year ${y}` }))} error={e.year_of_study} {...form.register("year_of_study")} />
              </div>
              <TextField label="Department" error={e.department} {...form.register("department")} />
              <TextAreaField label="Short biography" rows={4} hint="Up to 600 characters." error={e.bio} {...form.register("bio")} />
              <TextField label="Profile photo link" type="url" placeholder="https://" error={e.avatar_url} {...form.register("avatar_url")} />
              <TextField label="GitHub profile" type="url" placeholder="https://github.com/you" error={e.github_url} {...form.register("github_url")} />
              <TextField label="LinkedIn profile" type="url" placeholder="https://linkedin.com/in/you" error={e.linkedin_url} {...form.register("linkedin_url")} />
              <TextField label="Resume link" type="url" placeholder="https://" error={e.resume_url} {...form.register("resume_url")} />
              <Button type="submit" loading={save.isPending}>Save profile</Button>
            </Card>
            <Card className="h-fit">
              <h2 className="font-medium">Profile completion</h2>
              <p className="my-2 text-3xl font-semibold tabular-nums">{prof.completion_percent}%</p>
              <ProgressBar value={prof.completion_percent} label="Profile completion" />
              <p className="mt-3 text-xs text-ink-faint">Counts 10 fields: name, register number, department, year, photo, biography, GitHub, LinkedIn, resume and portfolio username.</p>
            </Card>
          </form>
        )}
      </DataState>
    </>
  );
}
