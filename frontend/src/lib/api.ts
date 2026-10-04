/** The single API client. Cookies carry the session; the CSRF cookie is echoed in a header for writes. */
const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api/v1";

export interface FieldError { loc: (string | number)[]; msg: string }

export class ApiError extends Error {
  constructor(public status: number, message: string, public fieldErrors: FieldError[] = []) {
    super(message);
  }
  get kind() {
    if (this.status === 0) return "network" as const;
    if (this.status === 401) return "unauthorized" as const;
    if (this.status === 403) return "forbidden" as const;
    if (this.status === 404) return "not_found" as const;
    if (this.status === 422 || this.status === 409) return "validation" as const;
    return "server" as const;
  }
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };

function csrfToken(): string {
  const m = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
  return m?.[1] ? decodeURIComponent(m[1]) : "";
}

type Params = Record<string, string | number | boolean | null | undefined>;

async function request<T>(method: string, path: string, opts: { body?: unknown; params?: Params; form?: FormData } = {}): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  for (const [k, v] of Object.entries(opts.params ?? {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const headers: Record<string, string> = {};
  if (method !== "GET") headers["X-CSRF-Token"] = csrfToken();
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(opts.body); }

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body, credentials: "include" });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  const isJson = res.headers.get("content-type")?.includes("application/json");
  if (!res.ok) {
    const data = isJson ? await res.json().catch(() => null) : null;
    const err = new ApiError(res.status, messageFor(res.status, data), Array.isArray(data?.errors) ? data.errors : []);
    if (res.status === 401 && !path.startsWith("/auth/")) onUnauthorized?.();
    throw err;
  }
  return (isJson ? res.json() : res.blob()) as Promise<T>;
}

function messageFor(status: number, data: { detail?: unknown } | null): string {
  if (typeof data?.detail === "string") return data.detail;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "We could not find what you were looking for.";
  return "Something went wrong on our side. Please try again.";
}

export const api = {
  get: <T>(path: string, params?: Params) => request<T>("GET", path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  del: (path: string) => request<void>("DELETE", path),
  upload: <T>(path: string, file: File) => { const form = new FormData(); form.append("file", file); return request<T>("POST", path, { form }); },
  download: async (path: string, filename: string) => {
    const blob = await request<Blob>("GET", path);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },
};
