import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FormDialog } from "@/components/FormDialog";
import { BarCard } from "@/components/charts";
import { PlacementSummaryView } from "@/features/placement/PlacementPage";
import { Badge, Button, Card, ConfirmDialog, DataState, EmptyState, FilterSelect, PageHeader, Pagination, SearchInput, SelectField, StatCard, TextAreaField, useToast } from "@/components/ui";
import { useList } from "@/hooks/useResource";
import { api } from "@/lib/api";
import { CERT_STATUS, GOAL_STATUS, SKILL_CATEGORIES, SKILL_LEVELS, formatDate, label, options } from "@/lib/constants";
import { z } from "zod";
import type { ActivityLogEntry, AdminAnalytics, AdminCertification, AdminStudent, AdminStudentDetail } from "@/types";

const Table = ({ caption, heads, children }: { caption: string; heads: string[]; children: React.ReactNode }) => (
  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
    <table className="w-full text-left text-sm"><caption className="sr-only">{caption}</caption>
      <thead className="border-b border-slate-200 bg-slate-50 text-ink-soft"><tr>{heads.map((h) => <th key={h} scope="col" className="whitespace-nowrap px-4 py-2 font-medium">{h}</th>)}</tr></thead>
      <tbody>{children}</tbody></table>
  </div>
);
const td = "px-4 py-2 align-top";

export function AdminOverviewPage() {
  const query = useQuery({ queryKey: ["admin-analytics"], queryFn: () => api.get<AdminAnalytics>("/admin/analytics") });
  const toast = useToast();
  return (
    <>
      <PageHeader title="Overview" description="Aggregates calculated from stored records."
        actions={<Button variant="secondary" onClick={() => api.download("/admin/reports/students.csv", "students.csv").catch((e: Error) => toast("error", e.message))}><Download className="h-4 w-4" aria-hidden />Export students CSV</Button>} />
      <DataState query={query}>
        {(a) => (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Active students" value={a.students.active} /><StatCard label="Inactive students" value={a.students.inactive} />
              <StatCard label="Certificates pending review" value={a.certifications.pending ?? 0} hint={`${a.certifications.verified ?? 0} verified · ${a.certifications.rejected ?? 0} rejected`} />
              <StatCard label="Average goal progress" value={a.learning.average_progress === null ? "–" : `${a.learning.average_progress}%`} hint={`${a.learning.total_goals} goals`} />
            </div>
            {a.students.total === 0 ? <EmptyState title="No students yet" description="Charts appear once students register." /> : (
              <div className="grid gap-4 lg:grid-cols-2">
                <BarCard title="Students by department" xKey="department" yKey="count" data={a.by_department} />
                <BarCard title="Students by year of study" xKey="year" yKey="count" data={a.by_year.map((y) => ({ year: y.year ? `Year ${y.year}` : "Unspecified", count: y.count }))} />
                <BarCard title="Skills by category" horizontal height={Math.max(180, a.skill_distribution.length * 36)} xKey="name" yKey="count" data={a.skill_distribution.map((s) => ({ name: label(SKILL_CATEGORIES, s.category), count: s.count }))} />
                <div>
                  <BarCard title="Average placement assessment score (%)" xKey="name" yKey="percent" unit="%" data={a.placement.map((p) => ({ name: p.label.split(" ")[0] ?? p.label, percent: p.average_percent }))} />
                  <p className="mt-2 text-xs text-ink-faint">{a.placement_note}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </DataState>
    </>
  );
}

export function AdminStudentsPage() {
  const [q, setQ] = useState(""); const [department, setDepartment] = useState(""); const [year, setYear] = useState(""); const [active, setActive] = useState(""); const [page, setPage] = useState(1);
  const onSearch = useCallback((v: string) => { setQ(v); setPage(1); }, []);
  const analytics = useQuery({ queryKey: ["admin-analytics"], queryFn: () => api.get<AdminAnalytics>("/admin/analytics") });
  const query = useList<AdminStudent>("/admin/students", { q, department, year, is_active: active, page, page_size: 15 });
  const qc = useQueryClient(); const toast = useToast();
  const [target, setTarget] = useState<AdminStudent | null>(null);
  const toggle = useMutation({
    mutationFn: (s: AdminStudent) => api.patch(`/admin/students/${s.id}/status`, { is_active: !s.is_active }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["/admin/students"] }); void qc.invalidateQueries({ queryKey: ["admin-analytics"] }); toast("success", "Account updated"); setTarget(null); },
    onError: (e) => toast("error", e.message),
  });
  return (
    <>
      <PageHeader title="Students" />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={q} onChange={onSearch} placeholder="Search name, email or register number" />
        <FilterSelect label="Department" value={department} onChange={(v) => { setDepartment(v); setPage(1); }} choices={(analytics.data?.by_department ?? []).filter((d) => d.department !== "Unspecified").map((d) => ({ value: d.department, label: d.department }))} />
        <FilterSelect label="Year" value={year} onChange={(v) => { setYear(v); setPage(1); }} choices={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: `Year ${y}` }))} />
        <FilterSelect label="Account" value={active} onChange={(v) => { setActive(v); setPage(1); }} choices={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} />
      </div>
      <DataState query={query} isEmpty={(d) => d.items.length === 0} empty={<EmptyState title="No students found" description="Try a different search or clear a filter." />}>
        {(d) => (
          <>
            <Table caption="Student directory" heads={["Name", "Register no.", "Department", "Year", "Status", "Actions"]}>
              {d.items.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className={td}><Link to={`/admin/students/${s.id}`} className="font-medium text-brand-600">{s.full_name}</Link><div className="text-xs text-ink-faint">{s.email}</div></td>
                  <td className={td}>{s.register_number ?? "–"}</td><td className={td}>{s.department ?? "–"}</td><td className={td}>{s.year_of_study ?? "–"}</td>
                  <td className={td}><Badge tone={s.is_active ? "verified" : "rejected"}>{s.is_active ? "Active" : "Inactive"}</Badge></td>
                  <td className={td}><Button variant="secondary" onClick={() => setTarget(s)} aria-label={`${s.is_active ? "Deactivate" : "Activate"} ${s.full_name}`}>{s.is_active ? "Deactivate" : "Activate"}</Button></td>
                </tr>))}
            </Table>
            <Pagination page={d.page} pageSize={d.page_size} total={d.total} onPage={setPage} />
          </>
        )}
      </DataState>
      <ConfirmDialog open={!!target} title={target?.is_active ? "Deactivate account?" : "Activate account?"} confirmLabel={target?.is_active ? "Deactivate" : "Activate"} loading={toggle.isPending}
        message={target?.is_active ? `${target?.full_name} will be signed out and unable to sign in. Their data is kept and their public portfolio is hidden.` : `${target?.full_name} will be able to sign in again.`}
        onClose={() => setTarget(null)} onConfirm={() => target && toggle.mutate(target)} />
    </>
  );
}

export function AdminStudentDetailPage() {
  const { id } = useParams();
  const query = useQuery({ queryKey: ["admin-student", id], queryFn: () => api.get<AdminStudentDetail>(`/admin/students/${id}`) });
  return (
    <>
      <Link to="/admin/students" className="text-sm font-medium text-brand-600">← All students</Link>
      <div className="mt-3" />
      <DataState query={query}>
        {(s) => (
          <>
            <PageHeader title={s.full_name} description={<>{s.email} · {s.department ?? "No department"} · Year {s.year_of_study ?? "–"} · Register no. {s.register_number ?? "–"} <Badge tone={s.is_active ? "verified" : "rejected"}>{s.is_active ? "Active" : "Inactive"}</Badge></>} />
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(s.counts).map(([k, v]) => <StatCard key={k} label={k.replace("_", " ")} value={v} />)}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card><h2 className="mb-2 font-medium">Skills (self-reported)</h2>{s.skills.length === 0 ? <p className="text-sm text-ink-soft">None recorded.</p> :
                <ul className="flex flex-wrap gap-2">{s.skills.map((k) => <li key={k.name}><Badge tone="brand">{k.name} · {label(SKILL_LEVELS, k.level)}</Badge></li>)}</ul>}</Card>
              <Card><h2 className="mb-2 font-medium">Certificates</h2>{s.certifications.length === 0 ? <p className="text-sm text-ink-soft">None submitted.</p> :
                <ul className="space-y-1 text-sm">{s.certifications.map((c) => <li key={c.id} className="flex justify-between gap-2"><span>{c.title}</span><Badge tone={c.status}>{label(CERT_STATUS, c.status)}</Badge></li>)}</ul>}</Card>
              <Card className="lg:col-span-2"><h2 className="mb-2 font-medium">Learning goals</h2>{s.goals.length === 0 ? <p className="text-sm text-ink-soft">None set.</p> :
                <ul className="space-y-1 text-sm">{s.goals.map((g, i) => <li key={i} className="flex justify-between gap-2"><span>{g.title}</span><span className="text-ink-soft">{label(GOAL_STATUS, g.status)} · {g.progress}%</span></li>)}</ul>}</Card>
            </div>
            <h2 className="mb-3 mt-8 text-lg font-semibold">Placement preparation</h2>
            <PlacementSummaryView s={s.placement} />
          </>
        )}
      </DataState>
    </>
  );
}

const reviewSchema = z.object({ status: z.enum(["verified", "rejected"], { errorMap: () => ({ message: "Choose a decision" }) }), notes: z.string().trim().max(1000, "Keep notes under 1000 characters") });

export function AdminCertificationsPage() {
  const [status, setStatus] = useState("pending"); const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const onSearch = useCallback((v: string) => { setQ(v); setPage(1); }, []);
  const query = useList<AdminCertification>("/admin/certifications", { status, q, page, page_size: 10 });
  const qc = useQueryClient(); const toast = useToast();
  const [reviewing, setReviewing] = useState<AdminCertification | null>(null);
  const review = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => api.patch(`/admin/certifications/${id}/review`, body),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["/admin/certifications"] }); void qc.invalidateQueries({ queryKey: ["admin-analytics"] }); },
  });
  return (
    <>
      <PageHeader title="Certificate queue" description="Inspect the evidence, then mark each certificate verified or rejected. Your name and the time are recorded." />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={q} onChange={onSearch} placeholder="Search title, issuer or student" />
        <FilterSelect label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} choices={options(CERT_STATUS)} />
      </div>
      <DataState query={query} isEmpty={(d) => d.items.length === 0} empty={<EmptyState title={status === "pending" && !q ? "Queue is clear" : "No certificates found"} description={status === "pending" && !q ? "There are no certificates waiting for review." : "Try different filters."} />}>
        {(d) => (
          <>
            <Table caption="Certificate submissions" heads={["Student", "Certificate", "Evidence", "Status", "Reviewed", "Actions"]}>
              {d.items.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className={td}>{c.student_name}</td>
                  <td className={td}><div className="font-medium">{c.title}</div><div className="text-xs text-ink-faint">{c.issuer} · {formatDate(c.issue_date)}</div></td>
                  <td className={td}><div className="flex flex-col items-start gap-1">
                    {c.credential_url && /^https?:\/\//i.test(c.credential_url) && <a className="text-brand-600" target="_blank" rel="noopener noreferrer nofollow" href={c.credential_url}>Credential link</a>}
                    {c.has_file ? <button className="text-brand-600 underline-offset-2 hover:underline" onClick={() => api.download(`/admin/certifications/${c.id}/file`, `certificate-${c.id.slice(0, 8)}`).catch((e: Error) => toast("error", e.message))}>Download document</button> : <span className="text-ink-faint">No document</span>}</div></td>
                  <td className={td}><Badge tone={c.status}>{label(CERT_STATUS, c.status)}</Badge></td>
                  <td className={td}>{c.reviewed_at ? <><div>{formatDate(c.reviewed_at)}</div><div className="text-xs text-ink-faint">by {c.reviewer_name ?? "unknown"}</div></> : "–"}</td>
                  <td className={td}><Button variant="secondary" onClick={() => setReviewing(c)} aria-label={`Review ${c.title} from ${c.student_name}`}>{c.status === "pending" ? "Review" : "Change decision"}</Button></td>
                </tr>))}
            </Table>
            <Pagination page={d.page} pageSize={d.page_size} total={d.total} onPage={setPage} />
          </>
        )}
      </DataState>
      <FormDialog open={!!reviewing} onClose={() => setReviewing(null)} title={`Review: ${reviewing?.title ?? ""}`} schema={reviewSchema} submitLabel="Save decision"
        defaultValues={{ status: "", notes: reviewing?.review_notes ?? "" }} successMessage="Review saved"
        onSubmit={(v) => review.mutateAsync({ id: reviewing!.id, body: { status: v.status, notes: v.notes || null } })}>
        {({ register, formState: { errors } }) => (
          <>
            <p className="text-sm text-ink-soft">Submitted by {reviewing?.student_name}.</p>
            <SelectField label="Decision" placeholder="Choose" choices={[{ value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" }]} error={errors.status as never} {...register("status")} />
            <TextAreaField label="Review notes (optional)" hint="Visible to the student." error={errors.notes as never} {...register("notes")} />
          </>
        )}
      </FormDialog>
    </>
  );
}

export function AdminActivityPage() {
  const [page, setPage] = useState(1);
  const query = useList<ActivityLogEntry>("/admin/activity-logs", { page, page_size: 20 });
  return (
    <>
      <PageHeader title="Audit log" description="Important administrator actions, newest first." />
      <DataState query={query} isEmpty={(d) => d.items.length === 0} empty={<EmptyState title="No administrator activity yet" />}>
        {(d) => (
          <>
            <Table caption="Administrator audit log" heads={["When", "Administrator", "Action", "Details"]}>
              {d.items.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0">
                  <td className={td}><time dateTime={l.created_at}>{new Date(l.created_at).toLocaleString()}</time></td><td className={td}>{l.actor_email ?? "–"}</td>
                  <td className={td}><Badge tone="brand">{l.action}</Badge></td><td className={td}>{l.summary ?? "–"}</td>
                </tr>))}
            </Table>
            <Pagination page={d.page} pageSize={d.page_size} total={d.total} onPage={setPage} />
          </>
        )}
      </DataState>
    </>
  );
}
