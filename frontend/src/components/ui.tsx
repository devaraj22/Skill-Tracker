import { AlertTriangle, CheckCircle2, Inbox, Loader2, X } from "lucide-react";
import { createContext, forwardRef, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { FieldError as RhfError } from "react-hook-form";
import { ApiError } from "@/lib/api";
import styles from "./ui.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- Buttons, cards, badges ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost"; loading?: boolean };
export function Button({ variant = "primary", loading, className, children, disabled, type = "button", ...rest }: BtnProps) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "border border-slate-300 bg-white text-ink hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-ink-soft hover:bg-slate-100",
  }[variant];
  return (
    <button type={type} disabled={disabled || loading} className={cx("inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60", styles, className)} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx("rounded-lg border border-slate-200 bg-white p-5 shadow-card", className)}>{children}</div>
);

const TONES: Record<string, string> = {
  verified: "bg-emerald-50 text-emerald-700 ring-emerald-200", completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200", in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
  rejected: "bg-red-50 text-red-700 ring-red-200", overdue: "bg-red-50 text-red-700 ring-red-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200", brand: "bg-brand-50 text-brand-700 ring-brand-100",
};
export const Badge = ({ tone = "neutral", children }: { tone?: string; children: ReactNode }) => (
  <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", TONES[tone] ?? TONES.neutral)}>{children}</span>
);

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <progress className={styles.progress} value={v} max={100} aria-label={label} />
  );
}

export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cx("animate-pulse rounded-md bg-slate-200/70", className)} />;

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </Card>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Inbox className="mb-3 h-8 w-8 text-slate-400" aria-hidden />
      <h2 className="font-medium">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const api = error instanceof ApiError ? error : null;
  const title = { network: "You appear to be offline", unauthorized: "Please sign in again", forbidden: "Access denied", not_found: "Not found", validation: "Check your input", server: "Something went wrong" }[api?.kind ?? "server"];
  return (
    <div role="alert" className="flex flex-col items-center rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-red-500" aria-hidden />
      <h2 className="font-medium text-red-900">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-red-800">{api?.message ?? "Please try again."}</p>
      {onRetry && api?.kind !== "forbidden" && api?.kind !== "not_found" && <Button variant="secondary" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/** Renders loading / error / empty / content for a TanStack query result. */
export function DataState<T>({ query, isEmpty, empty, skeleton, children }: {
  query: { data: T | undefined; isLoading: boolean; error: unknown; refetch: () => unknown };
  isEmpty?: (d: T) => boolean; empty?: ReactNode; skeleton?: ReactNode; children: (d: T) => ReactNode;
}) {
  if (query.isLoading) return <div aria-busy="true" aria-live="polite">{skeleton ?? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>}<span className="sr-only">Loading</span></div>;
  if (query.error || query.data === undefined) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (isEmpty?.(query.data) && empty) return <>{empty}</>;
  return <>{children(query.data)}</>;
}

/* ---------- Form fields ---------- */
interface FieldShell { label: string; error?: RhfError; hint?: string; id: string; children: ReactNode }
function FieldShell({ label, error, hint, id, children }: FieldShell) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-ink-faint">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}
const inputCls = (err?: RhfError) => cx("block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400", err ? "border-red-400" : "border-slate-300");
const describedBy = (id: string, err?: RhfError, hint?: string) => (err ? `${id}-err` : hint ? `${id}-hint` : undefined);

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: RhfError; hint?: string };
export const TextField = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, ...rest }, ref) => {
  const id = useId();
  return <FieldShell label={label} error={error} hint={hint} id={id}><input ref={ref} id={id} aria-invalid={!!error} aria-describedby={describedBy(id, error, hint)} className={inputCls(error)} {...rest} /></FieldShell>;
});
type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: RhfError; hint?: string };
export const TextAreaField = forwardRef<HTMLTextAreaElement, AreaProps>(({ label, error, hint, ...rest }, ref) => {
  const id = useId();
  return <FieldShell label={label} error={error} hint={hint} id={id}><textarea ref={ref} id={id} rows={3} aria-invalid={!!error} aria-describedby={describedBy(id, error, hint)} className={inputCls(error)} {...rest} /></FieldShell>;
});
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: RhfError; hint?: string; choices: { value: string; label: string }[]; placeholder?: string };
export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, hint, choices, placeholder, ...rest }, ref) => {
  const id = useId();
  return (
    <FieldShell label={label} error={error} hint={hint} id={id}>
      <select ref={ref} id={id} aria-invalid={!!error} aria-describedby={describedBy(id, error, hint)} className={inputCls(error)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
    </FieldShell>
  );
});
export const CheckField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }>(({ label, hint, ...rest }, ref) => (
  <label className="flex items-start gap-2 text-sm">
    <input ref={ref} type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" {...rest} />
    <span>{label}{hint && <span className="block text-xs text-ink-faint">{hint}</span>}</span>
  </label>
));

/* ---------- Dialog ---------- */
export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = Array.from(ref.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input:not([disabled]),select,textarea"));
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={cx("max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl", wide ? "sm:max-w-2xl" : "sm:max-w-md")}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded p-1 text-ink-faint hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", loading, onConfirm, onClose }: {
  open: boolean; title: string; message: string; confirmLabel?: string; loading?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-sm text-ink-soft">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Dialog>
  );
}

/* ---------- Toasts ---------- */
interface Toast { id: number; kind: "success" | "error"; text: string }
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, kind, text }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 5000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} role={t.kind === "error" ? "alert" : "status"} className="pointer-events-auto flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg">
            {t.kind === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden /> : <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Search + pagination ---------- */
export function SearchInput({ value, onChange, placeholder = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [local, setLocal] = useState(value);
  useEffect(() => { const t = setTimeout(() => onChange(local), 300); return () => clearTimeout(t); }, [local, onChange]);
  return <input type="search" aria-label={placeholder} placeholder={placeholder} value={local} onChange={(e) => setLocal(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm sm:w-64" />;
}
export function FilterSelect({ label, value, onChange, choices }: { label: string; value: string; onChange: (v: string) => void; choices: { value: string; label: string }[] }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
      <option value="">{label}: all</option>
      {choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
    </select>
  );
}
export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      <span className="text-ink-soft">Page {page} of {pages} ({total} total)</span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </nav>
  );
}

/** Safe external link: only http(s) is rendered as a link; opens without leaking referrer/opener. */
export function ExtLink({ href, children }: { href: string | null | undefined; children: ReactNode }) {
  if (!href || !/^https?:\/\//i.test(href)) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-brand-600 underline-offset-2 hover:underline">{children}</a>;
}
