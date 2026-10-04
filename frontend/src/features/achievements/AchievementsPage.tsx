import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import { Badge, Button, Card, CheckField, ConfirmDialog, DataState, EmptyState, ExtLink, FilterSelect, PageHeader, Pagination, SelectField, TextAreaField, TextField, useToast } from "@/components/ui";
import { useCrud, useList } from "@/hooks/useResource";
import { ACHIEVEMENT_KINDS, formatDate, label, options } from "@/lib/constants";
import { achievementSchema, nullify } from "@/schemas";
import { nullToBlank } from "@/features/skills/SkillsPage";
import type { Achievement } from "@/types";

const blank = { title: "", kind: "", organization: "", result: "", description: "", achieved_on: "", evidence_url: "", is_public: false };

export function AchievementsPage() {
  const [kind, setKind] = useState(""); const [page, setPage] = useState(1);
  const query = useList<Achievement>("/achievements", { kind, page, page_size: 10 });
  const { create, update, remove } = useCrud<Achievement>("/achievements");
  const [editing, setEditing] = useState<Achievement | "new" | null>(null);
  const [deleting, setDeleting] = useState<Achievement | null>(null);
  const toast = useToast();
  const current = editing && editing !== "new" ? editing : null;
  return (
    <>
      <PageHeader title="Achievements" description="Hackathons, competitions, internships, research and other accomplishments."
        actions={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" aria-hidden />Add achievement</Button>} />
      <div className="mb-4"><FilterSelect label="Type" value={kind} onChange={(v) => { setKind(v); setPage(1); }} choices={options(ACHIEVEMENT_KINDS)} /></div>
      <DataState query={query} isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title="No achievements yet" description="Record something you are proud of. You choose whether it is public." action={<Button onClick={() => setEditing("new")}>Add an achievement</Button>} />}>
        {(d) => (
          <>
            <ul className="space-y-3">
              {d.items.map((a) => (
                <li key={a.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="font-medium">{a.title}</h2>
                        <p className="text-sm text-ink-soft">{a.organization} · {formatDate(a.achieved_on)}{a.result && ` · ${a.result}`}</p>
                      </div>
                      <span className="flex gap-2"><Badge tone="brand">{label(ACHIEVEMENT_KINDS, a.kind)}</Badge><Badge>{a.is_public ? "Public" : "Private"}</Badge></span>
                    </div>
                    {a.description && <p className="mt-2 text-sm">{a.description}</p>}
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <ExtLink href={a.evidence_url}>Evidence</ExtLink>
                      <span className="ml-auto flex gap-1">
                        <Button variant="ghost" aria-label={`Edit ${a.title}`} onClick={() => setEditing(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" aria-label={`Delete ${a.title}`} onClick={() => setDeleting(a)}><Trash2 className="h-4 w-4" /></Button>
                      </span>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
            <Pagination page={d.page} pageSize={d.page_size} total={d.total} onPage={setPage} />
          </>
        )}
      </DataState>
      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={current ? "Edit achievement" : "Add achievement"} schema={achievementSchema}
        defaultValues={current ? { ...blank, ...nullToBlank(current) } : blank} successMessage={current ? "Achievement updated" : "Achievement added"}
        onSubmit={(v) => (current ? update.mutateAsync({ id: current.id, body: nullify(v) }) : create.mutateAsync(nullify(v)))}>
        {({ register, formState: { errors } }) => (
          <>
            <TextField label="Title" error={errors.title as never} {...register("title")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Type" placeholder="Choose" choices={options(ACHIEVEMENT_KINDS)} error={errors.kind as never} {...register("kind")} />
              <TextField label="Date" type="date" error={errors.achieved_on as never} {...register("achieved_on")} />
            </div>
            <TextField label="Event or organisation" error={errors.organization as never} {...register("organization")} />
            <TextField label="Award or result (optional)" error={errors.result as never} {...register("result")} />
            <TextAreaField label="Description (optional)" error={errors.description as never} {...register("description")} />
            <TextField label="Evidence link (optional)" type="url" placeholder="https://" error={errors.evidence_url as never} {...register("evidence_url")} />
            <CheckField label="Show on my public portfolio" {...register("is_public")} />
          </>
        )}
      </FormDialog>
      <ConfirmDialog open={!!deleting} title="Delete achievement?" message={`“${deleting?.title}” will be permanently removed.`} loading={remove.isPending} onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { toast("success", "Achievement deleted"); setDeleting(null); }, onError: (e) => toast("error", e.message) })} />
    </>
  );
}
