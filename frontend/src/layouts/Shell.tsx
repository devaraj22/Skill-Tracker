import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { SSMLogo } from "@/components/SSMLogo";

export interface NavItem { to: string; label: string; icon: ReactNode; end?: boolean }

export function Shell({ items, title }: { items: NavItem[]; title: string }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const nav = (
    <nav aria-label={`${title} navigation`} className="flex flex-col gap-1 p-3">
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 ${
              isActive
                ? "bg-[#0B2A63]/10 text-[#0B2A63] font-semibold border-l-3 border-[#0B2A63] shadow-2xs"
                : "text-slate-600 hover:bg-slate-100/70 hover:text-[#0B2A63] hover:translate-x-0.5"
            }`
          }
        >
          <span aria-hidden className="shrink-0">{i.icon}</span>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF7] lg:grid lg:grid-cols-[16rem_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <aside className="hidden border-r border-[#0B2A63]/15 bg-white lg:block shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 bg-[#FCFBF7]/50">
          <SSMLogo variant="navbar" />
          <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#0B2A63]/70 pl-0.5">
            {title}
          </div>
        </div>
        {nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#FCFBF7]/80">
              <SSMLogo variant="navbar" />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded p-1 hover:bg-slate-100 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between border-b border-[#0B2A63]/15 bg-white px-4 py-3 sm:px-6 shadow-xs">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="rounded p-2 hover:bg-slate-100 lg:hidden text-[#0B2A63]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="hidden text-sm text-slate-600 lg:block">
            Signed in as <strong className="font-semibold text-[#0B2A63]">{user?.full_name ?? user?.email}</strong>
          </span>
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#D32F2F] hover:bg-red-50/60 transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
