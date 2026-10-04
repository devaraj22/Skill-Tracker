import { Download, FileUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import { Badge, Button, Card, CheckField, ConfirmDialog, DataState, EmptyState, ExtLink, FilterSelect, PageHeader, Pagination, SearchInput, TextField, useToast } from "@/components/ui";
import { useCrud, useList } from "@/hooks/useResource";
import { api } from "@/lib/api";
import { CERT_STATUS, formatDate, label, options } from "@/lib/constants";
import { certificationSchema, nullify } from "@/schemas";
import { nullToBlank } from "@/features/skills/SkillsPage";
import type { Certification } from "@/types";

const blank = { title: "", issuer: "", issue_date: "", expiry_date: "", credential_url: "", is_public: false };

export function CertificationsPage() {
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const query = useList<Certification>("/certifications", { q, status, page, page_size: 10 });
  const { create, update, remove, refresh } = useCrud<Certification>("/certifications");
  const [editing, setEditing] = useState<Certification | "new" | null>(null);
  const [deleting, setDeleting] = useState<Certification | null>(null);
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const current = editing && editing !== "new" ? editing : null;

  async function onFile(file: File | undefined) {
    if (!file || !uploadFor) return;
    try { await api.upload(`/certifications/${uploadFor}/file`, file); await refresh(); toast("success", "Document uploaded. It is now pending review."); }
    catch (e) { toast("error", e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploadFor(null); if (fileInput.current) fileInput.current.value = ""; }
  }

  return (
    <>
      <PageHeader title="Certificates" description="Add certificates and attach evidence. An administrator reviews each one before it counts as verified."
        actions={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" aria-hidden />Add certificate</Button>} />
      <input ref={fileInput} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" className="sr-only" aria-label="Choose certificate document" tabIndex={-1} onChange={(e) => void onFile(e.target.files?.[0])} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search certificates" />
        <FilterSelect label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} choices={options(CERT_STATUS)} />
      </div>
      <DataState query={query} isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title={q || status ? "No certificates match" : "No certificates yet"} description="PDF, PNG or JPG files up to 5 MB are accepted as evidence." action={!q && !status ? <Button onClick={() => setEditing("new")}>Add a certificate</Button> : undefined} />}>
        {(d) => (
          <>
            <ul className="space-y-3">
              {d.items.map((c) => (
                <li key={c.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="font-medium">{c.title}</h2>
                        <p className="text-sm text-ink-soft">{c.issuer} · Issued {formatDate(c.issue_date)}{c.expiry_date && ` · Expires ${formatDate(c.expiry_date)}`}</p>
                      </div>
                      <Badge tone={c.status}>{label(CERT_STATUS, c.status)}</Badge>
                    </div>
                    {c.review_notes && <p className="mt-2 rounded bg-slate-50 p-2 text-sm"><span className="font-medium">Reviewer note: </span>{c.review_notes}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <ExtLink href={c.credential_url}>Verify credential</ExtLink>
                      <Button variant="secondary" onClick={() => { setUploadFor(c.id); fileInput.current?.click(); }}><FileUp className="h-4 w-4" aria-hidden />{c.has_file ? "Replace document" : "Upload document"}</Button>
                      {c.has_file && <Button variant="ghost" onClick={() => api.download(`/certifications/${c.id}/file`, `certificate-${c.id.slice(0, 8)}`).catch((e: Error) => toast("error", e.message))}><Download className="h-4 w-4" aria-hidden />Download</Button>}
                      {c.is_public && <Badge>Shown on portfolio once verified</Badge>}
                      <span className="ml-auto flex gap-1">
                        <Button variant="ghost" aria-label={`Edit ${c.title}`} onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" aria-label={`Delete ${c.title}`} onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></Button>
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

      <FormDialog open={editing !== null} onClose={() => setEditing(null)} title={current ? "Edit certificate" : "Add certificate"} schema={certificationSchema}
        defaultValues={current ? { ...blank, ...nullToBlank(current) } : blank} successMessage={current ? "Certificate updated" : "Certificate added. Upload a document to speed up review."}
        onSubmit={(v) => (current ? update.mutateAsync({ id: current.id, body: nullify(v) }) : create.mutateAsync(nullify(v)))}>
        {({ register, formState: { errors } }) => (
          <>
            {current && current.status !== "pending" && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Changing the title, issuer, dates or credential link sends this certificate back to review.</p>}
            <TextField label="Certificate title" error={errors.title as never} {...register("title")} />
            <TextField label="Issuing organisation" error={errors.issuer as never} {...register("issuer")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Issue date" type="date" error={errors.issue_date as never} {...register("issue_date")} />
              <TextField label="Expiry date (optional)" type="date" error={errors.expiry_date as never} {...register("expiry_date")} />
            </div>
            <TextField label="Credential verification link (optional)" type="url" placeholder="https://" error={errors.credential_url as never} {...register("credential_url")} />
            <CheckField label="Show on my public portfolio" hint="Only appears after an administrator verifies it." {...register("is_public")} />
          </>
        )}
      </FormDialog>
      <ConfirmDialog open={!!deleting} title="Delete certificate?" message={`“${deleting?.title}” and its uploaded document will be permanently removed.`} loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { toast("success", "Certificate deleted"); setDeleting(null); }, onError: (e) => toast("error", e.message) })} />
    </>
  );
}
