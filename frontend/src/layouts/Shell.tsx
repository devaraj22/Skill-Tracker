import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export interface NavItem { to: string; label: string; icon: ReactNode; end?: boolean }

export function Shell({ items, title }: { items: NavItem[]; title: string }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const nav = (
    <nav aria-label={`${title} navigation`} className="flex flex-col gap-1 p-3">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end} onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 ${isActive ? "bg-navy-50 text-navy-900 font-semibold border-l-2 border-navy-900 shadow-2xs" : "text-slate-600 hover:bg-slate-50 hover:text-navy-900 hover:translate-x-0.5"}`}>
          <span aria-hidden className="shrink-0">{i.icon}</span>{i.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[15rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <aside className="hidden border-r border-slate-200 bg-white lg:block">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              SSM
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-1">
                <span className="text-red-600">SSM</span> <span className="text-navy-900">SkillTrack</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500">{title}</span>
            </div>
          </div>
        </div>
        {nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center">
                  SSM
                </div>
                <div className="text-sm font-bold text-slate-900">
                  <span className="text-red-600">SSM</span> <span className="text-navy-900">SkillTrack</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 ml-1" />
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded p-1 hover:bg-slate-100 text-slate-500"><X className="h-5 w-5" /></button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="rounded p-2 hover:bg-slate-100 lg:hidden"><Menu className="h-5 w-5" /></button>
          <span className="hidden text-sm text-ink-soft lg:block">Signed in as <strong className="font-medium text-ink">{user?.full_name ?? user?.email}</strong></span>
          <button onClick={async () => { await logout(); navigate("/login"); }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-slate-100">
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6"><Outlet /></main>
      </div>
    </div>
  );
}
