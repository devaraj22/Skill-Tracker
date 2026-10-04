import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { ToastProvider } from "@/components/ui";
import { AuthProvider } from "@/lib/auth";

type Handler = (req: { method: string; path: string; body: unknown; query: URLSearchParams }) => { status?: number; json?: unknown } | undefined;

/** Replace fetch with a tiny router so tests exercise the real API client and hooks. */
export function mockApi(handler: Handler) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: URL | string, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    const method = init?.method ?? "GET";
    const body = init?.body && typeof init.body === "string" ? JSON.parse(init.body) : undefined;
    const path = url.pathname.replace(/^\/api\/v1/, "");
    calls.push({ method, path, body });
    const out = handler({ method, path, body, query: url.searchParams }) ?? { status: 404, json: { detail: "not mocked" } };
    const status = out.status ?? 200;
    if (status === 204) return new Response(null, { status });
    return new Response(JSON.stringify(out.json ?? {}), { status, headers: { "content-type": "application/json" } });
  }));
  return calls;
}

export const student = { id: "u1", email: "a@example.com", role: "student", is_active: true, full_name: "Alice Demo", created_at: "2025-01-01T00:00:00Z" };
export const admin = { ...student, id: "u2", email: "admin@example.com", role: "admin", full_name: null };
export const page = <T,>(items: T[]) => ({ items, total: items.length, page: 1, page_size: 20 });

export function renderApp(ui: ReactElement, { route = "/", withAuth = true }: { route?: string; withAuth?: boolean } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>{withAuth ? <AuthProvider>{ui}</AuthProvider> : ui}</ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
