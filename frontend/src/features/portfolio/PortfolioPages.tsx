import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, Linkedin } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, CheckField, DataState, ErrorState, ExtLink, PageHeader, Skeleton, TextField, useToast } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { ACHIEVEMENT_KINDS, PORTFOLIO_SECTIONS, SKILL_CATEGORIES, SKILL_LEVELS, formatDate, label } from "@/lib/constants";
import { portfolioSchema } from "@/schemas";
import type { Profile, PublicPortfolio } from "@/types";

type Values = { portfolio_username: string; portfolio_public: boolean; portfolio_sections: string[] };

export function PortfolioEditorPage() {
  const qc = useQueryClient(); const toast = useToast();
  const query = useQuery({ queryKey: ["profile"], queryFn: () => api.get<Profile>("/students/me") });
  const form = useForm<Values>({ resolver: zodResolver(portfolioSchema), defaultValues: { portfolio_username: "", portfolio_public: false, portfolio_sections: [] } });
  const p = query.data;
  useEffect(() => { if (p) form.reset({ portfolio_username: p.portfolio_username ?? "", portfolio_public: p.portfolio_public, portfolio_sections: p.portfolio_sections }); }, [p, form]);

  const save = useMutation({
    mutationFn: (v: Values) => api.patch<Profile>("/students/me", { ...v, portfolio_username: v.portfolio_username || null }),
    onSuccess: (d) => { qc.setQueryData(["profile"], d); toast("success", d.portfolio_public ? "Portfolio published" : "Portfolio saved as private"); },
    onError: (e) => { toast("error", e.message); if (e instanceof ApiError && e.status === 409) form.setError("portfolio_username", { message: e.message }); },
  });
  const url = p?.portfolio_username ? `${window.location.origin}/portfolio/${p.portfolio_username}` : null;

  return (
    <>
      <PageHeader title="Public portfolio" description="Choose what the world can see. Your email and register number are never shown, and only items you mark public are included." />
      <DataState query={query}>
        {(prof) => (
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate className="max-w-xl">
            <Card className="space-y-5">
              <TextField label="Portfolio username" hint="Your link will be /portfolio/your-username" error={form.formState.errors.portfolio_username} {...form.register("portfolio_username")} />
              <CheckField label="Publish my portfolio" hint="When off, your portfolio link shows “not found” to everyone." {...form.register("portfolio_public")} />
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Sections to show</legend>
                <div className="space-y-2">
                  {Object.entries(PORTFOLIO_SECTIONS).map(([key, text]) => <CheckField key={key} label={text} value={key} {...form.register("portfolio_sections")} />)}
                </div>
                <p className="mt-2 text-xs text-ink-faint">Items inside each section also need their own “show on portfolio” setting. Certificates must be verified by an administrator first.</p>
              </fieldset>
              <Button type="submit" loading={save.isPending}>Save portfolio settings</Button>
            </Card>
            {url && prof.portfolio_public && (
              <p className="mt-4 text-sm">Your portfolio is live at <Link className="font-medium text-brand-600 break-all" to={`/portfolio/${prof.portfolio_username}`}>{url}</Link></p>
            )}
          </form>
        )}
      </DataState>
    </>
  );
}

export function PublicPortfolioPage() {
  const { username = "" } = useParams();
  const q = useQuery({ queryKey: ["portfolio", username], queryFn: () => api.get<PublicPortfolio>(`/portfolio/${encodeURIComponent(username)}`), retry: false });

  if (q.isLoading) return <main className="mx-auto max-w-4xl p-6" aria-busy="true"><Skeleton className="h-32" /><span className="sr-only">Loading portfolio</span></main>;
  if (q.error instanceof ApiError && q.error.status === 404) {
    return <main className="mx-auto max-w-md p-10 text-center"><h1 className="text-2xl font-semibold">Portfolio not available</h1><p className="mt-2 text-ink-soft">This portfolio does not exist or has not been published.</p></main>;
  }
  if (!q.data) return <main className="mx-auto max-w-md p-10"><ErrorState error={q.error} onRetry={() => void q.refetch()} /></main>;
  const p = q.data;
  const has = (k: string) => p.sections.includes(k);
  const bySkill = Object.entries(p.skills.reduce<Record<string, typeof p.skills>>((acc, s) => { (acc[s.category] ??= []).push(s); return acc; }, {}));

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-5 px-5 py-10">
          {p.avatar_url && /^https?:\/\//i.test(p.avatar_url) && <img src={p.avatar_url} alt="" referrerPolicy="no-referrer" className="h-24 w-24 rounded-full object-cover" />}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{p.full_name}</h1>
            {p.bio && <p className="mt-2 max-w-xl text-ink-soft">{p.bio}</p>}
            <p className="mt-3 flex flex-wrap gap-4 text-sm">
              {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-medium text-brand-600"><Github className="h-4 w-4" aria-hidden />GitHub</a>}
              {p.linkedin_url && <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-medium text-brand-600"><Linkedin className="h-4 w-4" aria-hidden />LinkedIn</a>}
              <ExtLink href={p.resume_url}>Resume</ExtLink>
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-10 px-5 py-8">
        {has("skills") && p.skills.length > 0 && (
          <section aria-labelledby="skills-h"><h2 id="skills-h" className="mb-3 text-xl font-semibold">Skills</h2>
            <div className="space-y-3">{bySkill.map(([cat, list]) => (
              <div key={cat}><h3 className="mb-1 text-sm font-medium text-ink-soft">{label(SKILL_CATEGORIES, cat)}</h3>
                <ul className="flex flex-wrap gap-2">{list.map((s) => <li key={s.name}><Badge tone="brand">{s.name} · {label(SKILL_LEVELS, s.level)}</Badge></li>)}</ul></div>))}</div>
            <p className="mt-2 text-xs text-ink-faint">Skill levels are self-reported.</p></section>
        )}
        {has("projects") && p.projects.length > 0 && (
          <section aria-labelledby="proj-h"><h2 id="proj-h" className="mb-3 text-xl font-semibold">Projects</h2>
            <ul className="grid gap-4 sm:grid-cols-2">{p.projects.map((pr) => (
              <li key={pr.id}><Card className="h-full">
                <h3 className="font-medium">{pr.title}</h3><p className="mt-1 text-sm text-ink-soft">{pr.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1">{pr.tech_stack.map((t) => <Badge key={t}>{t}</Badge>)}</div>
                <p className="mt-3 flex gap-4 text-sm"><ExtLink href={pr.repo_url}>Repository</ExtLink><ExtLink href={pr.demo_url}>Live demo</ExtLink></p>
              </Card></li>))}</ul></section>
        )}
        {has("certifications") && p.certifications.length > 0 && (
          <section aria-labelledby="cert-h"><h2 id="cert-h" className="mb-3 text-xl font-semibold">Verified certificates</h2>
            <ul className="space-y-2">{p.certifications.map((c) => (
              <li key={c.title + c.issue_date} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                <span><span className="font-medium">{c.title}</span> · {c.issuer} · {formatDate(c.issue_date)}</span><ExtLink href={c.credential_url}>Check credential</ExtLink></li>))}</ul></section>
        )}
        {has("achievements") && p.achievements.length > 0 && (
          <section aria-labelledby="ach-h"><h2 id="ach-h" className="mb-3 text-xl font-semibold">Achievements</h2>
            <ul className="space-y-3">{p.achievements.map((a) => (
              <li key={a.title + a.achieved_on}><h3 className="font-medium">{a.title} <Badge>{label(ACHIEVEMENT_KINDS, a.kind)}</Badge></h3>
                <p className="text-sm text-ink-soft">{a.organization} · {formatDate(a.achieved_on)}{a.result && ` · ${a.result}`}</p>{a.description && <p className="mt-1 text-sm">{a.description}</p>}</li>))}</ul></section>
        )}
        {!p.skills.length && !p.projects.length && !p.certifications.length && !p.achievements.length && <p className="text-ink-soft">This student has not published any items yet.</p>}
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-ink-faint">Shared with SkillTrack. Information is provided by the student; only certificates marked “verified” were reviewed by the college.</footer>
    </div>
  );
}
