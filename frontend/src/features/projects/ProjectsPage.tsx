import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FormDialog } from "@/components/FormDialog";
import { Badge, Button, Card, CheckField, ConfirmDialog, DataState, EmptyState, ErrorState, ExtLink, PageHeader, SelectField, Skeleton, TextAreaField, TextField, useToast } from "@/components/ui";
import { useCrud, useList } from "@/hooks/useResource";
import { api } from "@/lib/api";
import { PROJECT_STATUS, formatDate, label, options } from "@/lib/constants";
import { nullify, projectSchema } from "@/schemas";
import { nullToBlank } from "@/features/skills/SkillsPage";
import { useMutation } from "@tanstack/react-query";
import type { Project } from "@/types";

const blank = { title: "", summary: "", description: "", tech_stack: "", repo_url: "", demo_url: "", cover_image_url: "", start_date: "", end_date: "", status: "in_progress", is_public: false };

const toBody = (v: Record<string, unknown>) => ({ ...nullify(v), tech_stack: String(v.tech_stack ?? "").split(",").map((t) => t.trim()).filter(Boolean) });

function Cover({ url, title }: { url: string | null; title: string }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken || !/^https?:\/\//i.test(url)) return <div aria-hidden className="flex h-36 items-center justify-center rounded-t-lg bg-brand-50 text-3xl font-semibold text-brand-600">{title.slice(0, 1).toUpperCase()}</div>;
  return <img src={url} alt="" referrerPolicy="no-referrer" loading="lazy" onError={() => setBroken(true)} className="h-36 w-full rounded-t-lg object-cover" />;
}

export function ProjectsPage() {
  const query = useList<Project>("/projects", { sort: "position", page_size: 100 });
  const { create, update, remove, refresh } = useCrud<Project>("/projects");
  const [editing, setEditing] = useState<Project | "new" | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const toast = useToast();
  const current = editing && editing !== "new" ? editing : null;
  const reorder = useMutation({ mutationFn: (ids: string[]) => api.post("/projects/reorder", { ids }), onSuccess: refresh, onError: (e: Error) => toast("error", e.message) });

  const move = (items: Project[], i: number, dir: -1 | 1) => {
    const ids = items.map((p) => p.id); const j = i + dir;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!]; reorder.mutate(ids);
  };

  return (
    <>
      <PageHeader title="Projects" description="Only projects marked public appear on your portfolio."
        actions={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" aria-hidden />Add project</Button>} />
      <DataState query={query} isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title="No projects yet" description="Add a project to build your portfolio." action={<Button onClick={() => setEditing("new")}>Add your first project</Button>} />}>
        {(d) => (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.items.map((p, i) => (
              <li key={p.id}>
                <Card className="flex h-full flex-col !p-0">
                  <Cover url={p.cover_image_url} title={p.title} />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-medium"><Link to={`/projects/${p.id}`} className="hover:text-brand-600">{p.title}</Link></h2>
                      <Badge tone={p.status}>{label(PROJECT_STATUS, p.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{p.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1">{p.tech_stack.map((t) => <Badge key={t} tone="brand">{t}</Badge>)}</div>
                    <div className="mt-auto flex flex-wrap items-center gap-3 pt-3 text-sm">
                      <ExtLink href={p.repo_url}>Repository</ExtLink><ExtLink href={p.demo_url}>Live demo</ExtLink>
                      <Badge>{p.is_public ? "Public" : "Private"}</Badge>
                    </div>
                    <div className="mt-2 flex justify-end gap-1">
                      <Button variant="ghost" aria-label={`Move ${p.title} up`} disabled={i === 0 || reorder.isPending} onClick={() => move(d.items, i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" aria-label={`Move ${p.title} down`} disabled={i === d.items.length - 1 || reorder.isPending} onClick={() => move(d.items, i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" aria-label={`Edit ${p.title}`} onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" aria-label={`Delete ${p.title}`} onClick={() => setDeleting(p)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </DataState>

      <FormDialog wide open={editing !== null} onClose={() => setEditing(null)} title={current ? "Edit project" : "Add project"} schema={projectSchema}
        defaultValues={current ? { ...blank, ...nullToBlank(current), tech_stack: current.tech_stack.join(", ") } : blank}
        successMessage={current ? "Project updated" : "Project added"}
        onSubmit={(v) => (current ? update.mutateAsync({ id: current.id, body: toBody(v) }) : create.mutateAsync(toBody(v)))}>
        {({ register, formState: { errors } }) => (
          <>
            <TextField label="Project title" error={errors.title as never} {...register("title")} />
            <TextField label="Short summary" error={errors.summary as never} {...register("summary")} />
            <TextAreaField label="Detailed description (optional)" rows={5} error={errors.description as never} {...register("description")} />
            <TextField label="Technology stack" hint="Separate with commas, e.g. React, FastAPI, PostgreSQL" error={errors.tech_stack as never} {...register("tech_stack")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="GitHub repository (optional)" type="url" placeholder="https://" error={errors.repo_url as never} {...register("repo_url")} />
              <TextField label="Live demo (optional)" type="url" placeholder="https://" error={errors.demo_url as never} {...register("demo_url")} />
            </div>
            <TextField label="Cover image link (optional)" type="url" placeholder="https://" error={errors.cover_image_url as never} {...register("cover_image_url")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Start date" type="date" error={errors.start_date as never} {...register("start_date")} />
              <TextField label="Completion date" type="date" error={errors.end_date as never} {...register("end_date")} />
              <SelectField label="Status" choices={options(PROJECT_STATUS)} {...register("status")} />
            </div>
            <CheckField label="Publish on my public portfolio" {...register("is_public")} />
          </>
        )}
      </FormDialog>
      <ConfirmDialog open={!!deleting} title="Delete project?" message={`“${deleting?.title}” will be permanently removed.`} loading={remove.isPending} onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { toast("success", "Project deleted"); setDeleting(null); }, onError: (e) => toast("error", e.message) })} />
    </>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ["/projects", id], queryFn: () => api.get<Project>(`/projects/${id}`) });
  if (q.isLoading) return <Skeleton className="h-64" />;
  if (!q.data) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const p = q.data;
  return (
    <article>
      <Link to="/projects" className="text-sm font-medium text-brand-600">← All projects</Link>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Cover url={p.cover_image_url} title={p.title} />
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold">{p.title}</h1><Badge tone={p.status}>{label(PROJECT_STATUS, p.status)}</Badge><Badge>{p.is_public ? "Public" : "Private"}</Badge></div>
          <p className="text-ink-soft">{p.summary}</p>
          {(p.start_date || p.end_date) && <p className="text-sm text-ink-faint">{formatDate(p.start_date)}{p.end_date && ` – ${formatDate(p.end_date)}`}</p>}
          {p.description && <p className="max-w-3xl whitespace-pre-line">{p.description}</p>}
          <div className="flex flex-wrap gap-1">{p.tech_stack.map((t) => <Badge key={t} tone="brand">{t}</Badge>)}</div>
          <div className="flex gap-4 text-sm"><ExtLink href={p.repo_url}>Repository</ExtLink><ExtLink href={p.demo_url}>Live demo</ExtLink></div>
        </div>
      </div>
    </article>
  );
}

