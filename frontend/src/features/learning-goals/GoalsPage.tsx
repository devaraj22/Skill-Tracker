import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import { Badge, Button, Card, ConfirmDialog, DataState, EmptyState, FilterSelect, PageHeader, Pagination, ProgressBar, SelectField, TextAreaField, TextField, useToast } from "@/components/ui";
import { useCrud, useList } from "@/hooks/useResource";
import { GOAL_STATUS, PRIORITY, SKILL_CATEGORIES, formatDate, label, options } from "@/lib/constants";
import { goalSchema, nullify } from "@/schemas";
import { nullToBlank } from "@/features/skills/SkillsPage";
import type { Goal } from "@/types";

const blank = { title: "", description: "", category: "", priority: "medium", target_date: "", progress: 0, status: "not_started" };

function ProgressSlider({ goal, onCommit }: { goal: Goal; onCommit: (n: number) => void }) {
  const [v, setV] = useState(goal.progress);
  const commit = () => v !== goal.progress && onCommit(v);
  return (
    <div className="mt-3">
      <ProgressBar value={v} label={`Progress for ${goal.title}`} />
      <label className="mt-2 flex items-center gap-3 text-xs text-ink-soft">
        <span className="w-20">Progress {v}%</span>
        <input type="range" min={0} max={100} step={5} value={v} aria-label={`Update progress for ${goal.title}`} className="w-full accent-brand-600"
          onChange={(e) => setV(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} />
      </label>
    </div>
  );
}

export function GoalsPage() {
  const [status, setStatus] = useState(""); const [category, setCategory] = useState(""); const [when, setWhen] = useState(""); const [page, setPage] = useState(1);
  const query = useList<Goal>("/goals", { status, category, overdue: when === "overdue" || undefined, upcoming: when === "upcoming" || undefined, page, page_size: 10 });
  const { create, update, remove } = useCrud<Goal>("/goals");
  const [editing, setEditing] = useState<Goal | "new" | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const toast = useToast();
  const current = editing && editing !== "new" ? editing : null;
  const reset = (fn: (v: string) => void) => (v: string) => { fn(v); setPage(1); };

  return (
    <>
      <PageHeader title="Learning goals" description="Progress and status stay in sync: 100% completes a goal, and any progress above 0% marks it in progress."
        actions={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" aria-hidden />Add goal</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterSelect label="Status" value={status} onChange={reset(setStatus)} choices={options(GOAL_STATUS)} />
        <FilterSelect label="Category" value={category} onChange={reset(setCategory)} choices={options(SKILL_CATEGORIES)} />
        <FilterSelect label="Deadline" value={when} onChange={reset(setWhen)} choices={[{ value: "upcoming", label: "Upcoming" }, { value: "overdue", label: "Overdue" }]} />
      </div>
      <DataState query={query} isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title={status || category || when ? "No goals match your filters" : "No learning goals yet"} description="Set a goal with a target date and track your progress." action={!(status || category || when) ? <Button onClick={() => setEditing("new")}>Add your first goal</Button> : undefined} />}>
        {(d) => (
          <>
            <ul className="space-y-3">
              {d.items.map((g) => (
                <li key={g.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="font-medium">{g.title}</h2>
                        <p className="text-sm text-ink-soft">{label(SKILL_CATEGORIES, g.category)}{g.target_date && ` · Target ${formatDate(g.target_date)}`}</p>
                      </div>
                      <span className="flex gap-2">
                        {g.is_overdue && <Badge tone="overdue">Overdue</Badge>}
                        <Badge tone={g.status}>{label(GOAL_STATUS, g.status)}</Badge><Badge>{label(PRIORITY, g.priority)} priority</Badge>
                      </span>
                    </div>
                    {g.description && <p className="mt-2 text-sm">{g.description}</p>}
                    <ProgressSlider key={`${g.id}-${g.progress}`} goal={g} onCommit={(n) => update.mutate({ id: g.id, body: { progress: n } }, { onError: (e) => toast("error", e.message) })} />
                    <div className="mt-2 flex justify-end gap-1">
                      <Button variant="ghost" aria-label={`Edit ${g.title}`} onClick={() => setEditing(g)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" aria-label={`Delete ${g.title}`} onClick={() => setDeleting(g)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
            <Pagination page={d.page} pageSize={d.page_size} total={d.total} onPage={setPage} />
          </>
        )}
      </DataState>
      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={current ? "Edit goal" : "Add goal"} schema={goalSchema}
        defaultValues={current ? { ...blank, ...nullToBlank(current) } : blank} successMessage={current ? "Goal updated" : "Goal added"}
        onSubmit={(v) => (current ? update.mutateAsync({ id: current.id, body: nullify(v) }) : create.mutateAsync(nullify(v)))}>
        {({ register, formState: { errors } }) => (
          <>
            <TextField label="Title" error={errors.title as never} {...register("title")} />
            <TextAreaField label="Description (optional)" error={errors.description as never} {...register("description")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Category" placeholder="Choose" choices={options(SKILL_CATEGORIES)} error={errors.category as never} {...register("category")} />
              <SelectField label="Priority" choices={options(PRIORITY)} {...register("priority")} />
              <TextField label="Target date (optional)" type="date" error={errors.target_date as never} {...register("target_date")} />
              <TextField label="Progress (0–100)" type="number" min={0} max={100} error={errors.progress as never} {...register("progress")} />
            </div>
            <SelectField label="Status" choices={options(GOAL_STATUS)} {...register("status")} />
          </>
        )}
      </FormDialog>
      <ConfirmDialog open={!!deleting} title="Delete goal?" message={`“${deleting?.title}” will be permanently removed.`} loading={remove.isPending} onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { toast("success", "Goal deleted"); setDeleting(null); }, onError: (e) => toast("error", e.message) })} />
    </>
  );
}
