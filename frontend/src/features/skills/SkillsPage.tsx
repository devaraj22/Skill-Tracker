import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import { Badge, Button, Card, CheckField, ConfirmDialog, DataState, EmptyState, ExtLink, FilterSelect, PageHeader, Pagination, SearchInput, SelectField, TextAreaField, TextField, useToast } from "@/components/ui";
import { useCrud, useList } from "@/hooks/useResource";
import { SKILL_CATEGORIES, SKILL_LEVELS, label, options } from "@/lib/constants";
import { nullify, skillSchema } from "@/schemas";
import type { Skill } from "@/types";

const blank = { name: "", category: "", level: "", evidence_url: "", notes: "", is_public: true };
const LEVEL_TONE: Record<string, string> = { beginner: "neutral", intermediate: "in_progress", advanced: "brand", expert: "verified" };

export function SkillsPage() {
  const [q, setQ] = useState(""); const [category, setCategory] = useState(""); const [level, setLevel] = useState("");
  const [sort, setSort] = useState("name"); const [page, setPage] = useState(1);
  const onSearch = useCallback((v: string) => { setQ(v); setPage(1); }, []);
  const query = useList<Skill>("/skills", { q, category, level, sort, order: sort === "updated_at" ? "desc" : "asc", page, page_size: 12 });
  const { create, update, remove } = useCrud<Skill>("/skills");
  const [editing, setEditing] = useState<Skill | "new" | null>(null);
  const [deleting, setDeleting] = useState<Skill | null>(null);
  const toast = useToast();
  const filtered = !!(q || category || level);

  const current = editing && editing !== "new" ? editing : null;
  const defaults = current ? { ...blank, ...nullToBlank(current) } : blank;

  return (
    <>
      <PageHeader title="Skills" description="Levels are self-reported unless an assessment has verified them."
        actions={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" aria-hidden />Add skill</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={q} onChange={onSearch} placeholder="Search skills" />
        <FilterSelect label="Category" value={category} onChange={(v) => { setCategory(v); setPage(1); }} choices={options(SKILL_CATEGORIES)} />
        <FilterSelect label="Level" value={level} onChange={(v) => { setLevel(v); setPage(1); }} choices={options(SKILL_LEVELS)} />
        <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="name">Sort: name</option><option value="level">Sort: level</option><option value="category">Sort: category</option><option value="updated_at">Sort: recently updated</option>
        </select>
      </div>

      <DataState query={query} isEmpty={(d) => d.items.length === 0}
        empty={filtered ? <EmptyState title="No skills match your filters" description="Try a different search or clear a filter." />
          : <EmptyState title="No skills yet" description="Add the skills you have so you can track them and share them on your portfolio." action={<Button onClick={() => setEditing("new")}>Add your first skill</Button>} />}>
        {(d) => (
          <>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {d.items.map((s) => (
                <li key={s.id}>
                  <Card className="h-full">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-medium">{s.name}</h2>
                      <Badge tone={LEVEL_TONE[s.level]}>{label(SKILL_LEVELS, s.level)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{label(SKILL_CATEGORIES, s.category)}</p>
                    {s.notes && <p className="mt-2 line-clamp-3 text-sm">{s.notes}</p>}
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-3"><ExtLink href={s.evidence_url}>Evidence</ExtLink>{!s.is_public && <Badge>Hidden from portfolio</Badge>}</span>
                      <span className="flex gap-1">
                        <Button variant="ghost" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" aria-label={`Delete ${s.name}`} onClick={() => setDeleting(s)}><Trash2 className="h-4 w-4" /></Button>
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

      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={current ? "Edit skill" : "Add skill"} schema={skillSchema}
        defaultValues={defaults} successMessage={current ? "Skill updated" : "Skill added"} submitLabel={current ? "Save changes" : "Add skill"}
        onSubmit={(v) => (current ? update.mutateAsync({ id: current.id, body: nullify(v) }) : create.mutateAsync(nullify(v)))}>
        {({ register, formState: { errors } }) => (
          <>
            <TextField label="Skill name" error={errors.name as never} {...register("name")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Category" placeholder="Choose" choices={options(SKILL_CATEGORIES)} error={errors.category as never} {...register("category")} />
              <SelectField label="Level (self-reported)" placeholder="Choose" choices={options(SKILL_LEVELS)} error={errors.level as never} {...register("level")} />
            </div>
            <TextField label="Evidence link (optional)" type="url" placeholder="https://" error={errors.evidence_url as never} {...register("evidence_url")} />
            <TextAreaField label="Notes (optional)" error={errors.notes as never} {...register("notes")} />
            <CheckField label="Show on my public portfolio" {...register("is_public")} />
          </>
        )}
      </FormDialog>

      <ConfirmDialog open={!!deleting} title="Delete skill?" message={`“${deleting?.name}” will be permanently removed.`} loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { toast("success", "Skill deleted"); setDeleting(null); }, onError: (e) => toast("error", e.message) })} />
    </>
  );
}

export function nullToBlank(o: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === null ? "" : v]));
}
