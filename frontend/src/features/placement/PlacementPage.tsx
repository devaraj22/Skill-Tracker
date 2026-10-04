import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import { BarCard, LineCard } from "@/components/charts";
import { Badge, Button, Card, ConfirmDialog, DataState, EmptyState, FilterSelect, PageHeader, Pagination, ProgressBar, SelectField, TextAreaField, TextField, useToast } from "@/components/ui";
import { useCrud, useList } from "@/hooks/useResource";
import { api } from "@/lib/api";
import { PLACEMENT_CATEGORIES, formatDate, label, options } from "@/lib/constants";
import { assessmentSchema, nullify } from "@/schemas";
import { nullToBlank } from "@/features/skills/SkillsPage";
import type { Assessment, PlacementSummary } from "@/types";

const blank = { category: "", title: "", score: "", max_score: "", assessed_on: "", notes: "" };

export function PlacementSummaryView({ s }: { s: PlacementSummary }) {
  const [cat, setCat] = useState(Object.keys(s.history)[0] ?? "");
  const withData = s.categories.filter((c) => c.has_data);
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm text-ink-soft">Preparation average</p>
            <p className="text-3xl font-semibold tabular-nums">{s.overall_percent === null ? "No data yet" : `${s.overall_percent}%`}</p>
          </div>
          <p className="text-sm text-ink-soft">Based on {s.categories_with_data} of {s.categories_total} categories</p>
        </div>
        <p className="mt-2 text-xs text-ink-faint">{s.formula}</p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-medium">Latest score by category</h3>
          <ul className="space-y-3">
            {s.categories.map((c) => (
              <li key={c.category}>
                <div className="mb-1 flex items-center justify-between text-sm"><span>{c.label}</span>
                  {c.has_data ? <span className="tabular-nums">{c.latest_percent}%</span> : <Badge tone="pending">Not assessed</Badge>}</div>
                <ProgressBar value={c.latest_percent ?? 0} label={`${c.label} latest score`} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-medium">Suggested next steps</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">{s.next_steps.map((t) => <li key={t}>{t}</li>)}</ul>
          <h3 className="mb-2 mt-5 text-sm font-medium">Resume and portfolio checklist</h3>
          <ul className="space-y-1.5 text-sm">
            {s.checklist.map((c) => <li key={c.key} className="flex items-center gap-2">{c.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Done" /> : <Circle className="h-4 w-4 text-slate-300" aria-label="Not done" />}<span className={c.done ? "text-ink-soft line-through" : ""}>{c.label}</span></li>)}
          </ul>
        </Card>
      </div>
      {withData.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <BarCard title="Latest score by category (%)" data={withData.map((c) => ({ name: c.label.split(" ")[0] ?? c.label, percent: c.latest_percent ?? 0 }))} xKey="name" yKey="percent" unit="%" />
          <div className="space-y-2">
            <FilterSelect label="History for" value={cat} onChange={setCat} choices={Object.keys(s.history).map((k) => ({ value: k, label: label(PLACEMENT_CATEGORIES, k) }))} />
            <LineCard title={`Score history: ${label(PLACEMENT_CATEGORIES, cat) || "choose a category"}`} data={s.history[cat] ?? []} />
          </div>
        </div>
      )}
    </div>
  );
}

export function PlacementPage() {
  const [category, setCategory] = useState(""); const [page, setPage] = useState(1);
  const summary = useQuery({ queryKey: ["placement-summary"], queryFn: () => api.get<PlacementSummary>("/placement/summary") });
  const list = useList<Assessment>("/placement/assessments", { category, page, page_size: 10 });
  const { create, update, remove } = useCrud<Assessment>("/placement/assessments");
  const [editing, setEditing] = useState<Assessment | "new" | null>(null);
  const [deleting, setDeleting] = useState<Assessment | null>(null);
  const toast = useToast();
  const current = editing && editing !== "new" ? editing : null;

  return (
    <>
      <PageHeader title="Placement preparation" description="A tracker for your own practice results. It does not predict job outcomes."
        actions={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" aria-hidden />Record assessment</Button>} />
      <DataState query={summary}>{(s) => <PlacementSummaryView s={s} />}</DataState>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Assessment history</h2>
      <div className="mb-3"><FilterSelect label="Category" value={category} onChange={(v) => { setCategory(v); setPage(1); }} choices={options(PLACEMENT_CATEGORIES)} /></div>
      <DataState query={list} isEmpty={(d) => d.items.length === 0} empty={<EmptyState title="No assessments recorded" description="Record a mock test or practice result to see your progress." />}>
        {(d) => (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Assessment history</caption>
                <thead className="border-b border-slate-200 bg-slate-50 text-ink-soft"><tr>
                  {["Date", "Category", "Assessment", "Score", "Percent", ""].map((h) => <th key={h} scope="col" className="px-4 py-2 font-medium">{h || <span className="sr-only">Actions</span>}</th>)}
                </tr></thead>
                <tbody>{d.items.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">{formatDate(a.assessed_on)}</td><td className="px-4 py-2">{label(PLACEMENT_CATEGORIES, a.category)}</td><td className="px-4 py-2">{a.title}</td>
                    <td className="px-4 py-2 tabular-nums">{a.score} / {a.max_score}</td><td className="px-4 py-2 tabular-nums">{a.percent}%</td>
                    <td className="px-4 py-2 text-right"><span className="inline-flex gap-1">
                      <Button variant="ghost" aria-label={`Edit ${a.title}`} onClick={() => setEditing(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" aria-label={`Delete ${a.title}`} onClick={() => setDeleting(a)}><Trash2 className="h-4 w-4" /></Button></span></td>
                  </tr>))}</tbody>
              </table>
            </div>
            <Pagination page={d.page} pageSize={d.page_size} total={d.total} onPage={setPage} />
          </>
        )}
      </DataState>

      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={current ? "Edit assessment" : "Record assessment"} schema={assessmentSchema}
        defaultValues={current ? { ...blank, ...nullToBlank(current) } : blank} successMessage={current ? "Assessment updated" : "Assessment recorded"}
        onSubmit={(v) => (current ? update.mutateAsync({ id: current.id, body: nullify(v) }) : create.mutateAsync(nullify(v)))}>
        {({ register, formState: { errors } }) => (
          <>
            <SelectField label="Category" placeholder="Choose" choices={options(PLACEMENT_CATEGORIES)} error={errors.category as never} {...register("category")} />
            <TextField label="Assessment title" error={errors.title as never} {...register("title")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Score" type="number" step="any" min={0} error={errors.score as never} {...register("score")} />
              <TextField label="Maximum score" type="number" step="any" min={0} error={errors.max_score as never} {...register("max_score")} />
              <TextField label="Date" type="date" error={errors.assessed_on as never} {...register("assessed_on")} />
            </div>
            <TextAreaField label="Notes (optional)" error={errors.notes as never} {...register("notes")} />
          </>
        )}
      </FormDialog>
      <ConfirmDialog open={!!deleting} title="Delete assessment?" message={`“${deleting?.title}” will be permanently removed.`} loading={remove.isPending} onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { toast("success", "Assessment deleted"); setDeleting(null); }, onError: (e) => toast("error", e.message) })} />
    </>
  );
}
