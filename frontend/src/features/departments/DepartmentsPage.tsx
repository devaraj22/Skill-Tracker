import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import {
  Badge, Button, Card, DataState, EmptyState,
  FilterSelect, PageHeader, SelectField,
  TextField, useToast,
} from "@/components/ui";
import { api } from "@/lib/api";
import { SCHOOL_GROUPS, SKILL_CATEGORIES, SKILL_LEVELS, label, options } from "@/lib/constants";
import type { Department, SkillRequirement } from "@/types";
import { z } from "zod";
import "./DepartmentsPage.css";

// ── schemas ──────────────────────────────────────────────────────────────────
const deptSchema = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, numbers, _ or -"),
  name: z.string().min(2).max(120),
  school_group: z.enum(["soc", "non_soc"], { errorMap: () => ({ message: "Choose a group" }) }),
  is_active: z.boolean().default(true),
});

const reqSchema = z.object({
  skill_name: z.string().min(1).max(80),
  category: z.enum(["programming", "dsa", "ai_ml", "web", "databases", "cloud", "tools", "soft_skills"],
    { errorMap: () => ({ message: "Choose a category" }) }),
  target_level: z.enum(["beginner", "intermediate", "advanced", "expert"],
    { errorMap: () => ({ message: "Choose a level" }) }),
  study_year: z.number().nullable().optional(),
  weight: z.number().min(0.1).default(1),
  is_required: z.boolean().default(true),
});

// ── GroupBadge ────────────────────────────────────────────────────────────────
function GroupBadge({ group }: { group: string }) {
  const cls = group === "soc" ? "dept-group-badge dept-group-badge--soc" : "dept-group-badge dept-group-badge--non-soc";
  return <span className={cls}>{label(SCHOOL_GROUPS, group)}</span>;
}

// ── RequirementsSection ───────────────────────────────────────────────────────
function RequirementsSection({ dept }: { dept: Department }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  const query = useQuery<SkillRequirement[]>({
    queryKey: ["dept-requirements", dept.id],
    queryFn: () => api.get(`/departments/${dept.id}/requirements`),
  });

  const addReq = useMutation({
    mutationFn: (body: unknown) => api.post(`/departments/${dept.id}/requirements`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dept-requirements", dept.id] });
      setAdding(false);
      toast("success", "Requirement added");
    },
    onError: (e: Error) => toast("error", e.message),
  });

  const deleteReq = useMutation({
    mutationFn: (reqId: string) => api.del(`/departments/${dept.id}/requirements/${reqId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dept-requirements", dept.id] });
      toast("success", "Requirement removed");
    },
    onError: (e: Error) => toast("error", e.message),
  });

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Skill requirements</h3>
        <Button variant="secondary" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" aria-hidden /> Add
        </Button>
      </div>
      <DataState query={query} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No requirements yet" description="Add skill targets for this department." />}>
        {(reqs) => (
          <div className="requirements-list">
            {reqs.map((r) => (
              <div key={r.id} className="req-item">
                <div>
                  <div className="req-item-name">{r.skill_name}</div>
                  <div className="req-item-meta">
                    {label(SKILL_CATEGORIES, r.category)} · Target: {label(SKILL_LEVELS, r.target_level)}
                    {r.study_year ? ` · Year ${r.study_year}` : " · All years"}
                    {r.is_required ? "" : " · Optional"}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => deleteReq.mutate(r.id)}
                  aria-label={`Remove requirement ${r.skill_name}`}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </DataState>

      <FormDialog
        open={adding}
        onClose={() => setAdding(false)}
        title="Add skill requirement"
        schema={reqSchema}
        submitLabel="Add requirement"
        defaultValues={{ skill_name: "", category: "", target_level: "", weight: 1, is_required: true }}
        successMessage="Requirement added"
        onSubmit={(v) => addReq.mutateAsync(v)}
      >
        {({ register, formState: { errors } }) => (
          <>
            <TextField label="Skill name" error={errors.skill_name as never} {...register("skill_name")} />
            <SelectField
              label="Category"
              placeholder="Choose category"
              choices={options(SKILL_CATEGORIES)}
              error={errors.category as never}
              {...register("category")}
            />
            <SelectField
              label="Target level"
              placeholder="Choose level"
              choices={options(SKILL_LEVELS)}
              error={errors.target_level as never}
              {...register("target_level")}
            />
          </>
        )}
      </FormDialog>
    </Card>
  );
}

// ── DepartmentsPage ───────────────────────────────────────────────────────────
export function AdminDepartmentsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [groupFilter, setGroupFilter] = useState("");

  const query = useQuery<Department[]>({
    queryKey: ["departments", groupFilter],
    queryFn: () => api.get("/departments", { active_only: false, group: groupFilter || undefined }),
  });

  const createDept = useMutation({
    mutationFn: (body: unknown) => api.post("/departments", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["departments"] });
      setCreating(false);
      toast("success", "Department created");
    },
    onError: (e: Error) => toast("error", e.message),
  });

  const toggleActive = useMutation({
    mutationFn: (d: Department) => api.patch(`/departments/${d.id}`, { is_active: !d.is_active }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["departments"] });
      toast("success", "Department updated");
    },
    onError: (e: Error) => toast("error", e.message),
  });

  return (
    <>
      <PageHeader
        title="Departments"
        description="Configure the academic departments that students and staff are assigned to."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Add department
          </Button>
        }
      />

      <div className="mb-4">
        <FilterSelect
          label="Group"
          value={groupFilter}
          onChange={setGroupFilter}
          choices={[
            { value: "soc", label: "SOC" },
            { value: "non_soc", label: "Non-SOC" },
          ]}
        />
      </div>

      <DataState
        query={query}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState title="No departments configured" description="Add your first department to get started." />}
      >
        {(depts) => (
          <>
            <div className="dept-table-wrapper">
              <table className="dept-table" aria-label="Departments">
                <thead>
                  <tr>
                    <th scope="col">Code</th>
                    <th scope="col">Name</th>
                    <th scope="col">Group</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {depts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td><code className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">{d.code}</code></td>
                      <td>
                        <button
                          className="font-semibold text-navy-900 hover:text-amber-700 hover:underline transition-colors text-left"
                          onClick={() => setSelected(selected?.id === d.id ? null : d)}
                        >
                          {d.name}
                        </button>
                      </td>
                      <td><GroupBadge group={d.school_group} /></td>
                      <td>
                        <Badge tone={d.is_active ? "verified" : "rejected"}>
                          {d.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="secondary"
                          onClick={() => toggleActive.mutate(d)}
                          aria-label={`${d.is_active ? "Deactivate" : "Activate"} ${d.name}`}
                        >
                          {d.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected && (
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-brand-600" aria-hidden />
                  <h2 className="text-lg font-semibold">{selected.name} — Requirements</h2>
                </div>
                <RequirementsSection dept={selected} />
              </div>
            )}
          </>
        )}
      </DataState>

      <FormDialog
        open={creating}
        onClose={() => setCreating(false)}
        title="Create department"
        schema={deptSchema}
        submitLabel="Create"
        defaultValues={{ code: "", name: "", school_group: "", is_active: true }}
        successMessage="Department created"
        onSubmit={(v) => createDept.mutateAsync(v)}
      >
        {({ register, formState: { errors } }) => (
          <>
            <TextField label="Code (e.g. COMP)" hint="Uppercase letters and numbers only." error={errors.code as never} {...register("code")} />
            <TextField label="Official department name" error={errors.name as never} {...register("name")} />
            <SelectField
              label="School group"
              placeholder="Choose group"
              choices={[{ value: "soc", label: "SOC" }, { value: "non_soc", label: "Non-SOC" }]}
              error={errors.school_group as never}
              {...register("school_group")}
            />
          </>
        )}
      </FormDialog>
    </>
  );
}

export { AdminDepartmentsPage as DepartmentsPage };
