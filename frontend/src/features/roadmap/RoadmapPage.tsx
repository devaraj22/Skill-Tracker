import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Binary,
  Brain,
  Check,
  Clock,
  Cloud,
  Compass,
  ExternalLink,
  Layers,
  Layout,
  Plus,
  Shield,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { DataState, PageHeader, Skeleton, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { SKILL_CATEGORIES, SKILL_LEVELS, label } from "@/lib/constants";
import type {
  EnrollRoadmapGoalPayload,
  RoadmapMilestone,
  RoadmapPlan,
  RoadmapResource,
  RoleOverview,
} from "@/types";
import "./RoadmapPage.css";

function renderRoleIcon(iconName: string): ReactNode {
  const iClass = "h-4 w-4";
  switch (iconName) {
    case "Layout": return <Layout className={iClass} />;
    case "Brain": return <Brain className={iClass} />;
    case "Cloud": return <Cloud className={iClass} />;
    case "Binary": return <Binary className={iClass} />;
    case "Shield": return <Shield className={iClass} />;
    case "Smartphone": return <Smartphone className={iClass} />;
    default: return <Compass className={iClass} />;
  }
}

export function RoadmapPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("fullstack_web");

  const rolesQuery = useQuery({
    queryKey: ["roadmap-roles"],
    queryFn: () => api.get<RoleOverview[]>("/roadmap/roles"),
  });

  const planQuery = useQuery({
    queryKey: ["roadmap-plan", selectedRole],
    queryFn: () => api.get<RoadmapPlan>(`/roadmap/plan?role_id=${selectedRole}`),
    enabled: Boolean(selectedRole),
  });

  const enrollMutation = useMutation({
    mutationFn: (payload: EnrollRoadmapGoalPayload) =>
      api.post("/roadmap/enroll", payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["roadmap-plan", selectedRole] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      void qc.invalidateQueries({ queryKey: ["goals"] });
      toast("success", "Milestone added to your Learning Goals!");
    },
    onError: (err) => {
      toast("error", err.message);
    },
  });

  const roles = rolesQuery.data ?? [];
  const plan = planQuery.data;

  // Group milestones by phase
  const phases = plan
    ? Array.from(new Set(plan.milestones.map((m) => m.phase_name))).map((phaseName) => ({
        name: phaseName,
        milestones: plan.milestones.filter((m) => m.phase_name === phaseName),
      }))
    : [];

  return (
    <div className="roadmap-page">
      <PageHeader
        title="AI Learning Roadmap & Resource Guides"
        description="Target specific industry career roles, discover your real-time preparation gap, and follow step-by-step curated learning paths."
      />

      {/* Role Navigation Tabs */}
      <div className="roadmap-roles-nav" role="tablist" aria-label="Career roles">
        {roles.map((r) => {
          const isActive = selectedRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              className={`roadmap-role-pill${isActive ? " active" : ""}`}
              onClick={() => setSelectedRole(r.id)}
            >
              {renderRoleIcon(r.icon)}
              <span>{r.title}</span>
            </button>
          );
        })}
      </div>

      <DataState
        query={planQuery}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        }
      >
        {(p) => {
          const readinessClass = p.readiness_level.toLowerCase().replace(/\s+/g, "-");
          return (
            <>
              {/* Overview Card */}
              <div className="roadmap-overview-card">
                <div className="roadmap-overview-main">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                      {renderRoleIcon(p.icon)}
                    </span>
                    <h2 className="roadmap-overview-title">{p.role_title}</h2>
                  </div>
                  <p className="roadmap-overview-desc">{p.role_description}</p>
                  <div className="roadmap-meta-badges">
                    <span className="roadmap-meta-tag">
                      <Clock className="h-3.5 w-3.5" /> 4–6 Months Target
                    </span>
                    <span className="roadmap-meta-tag">
                      <Layers className="h-3.5 w-3.5" /> {p.milestones.length} Core Milestones
                    </span>
                    <span className="roadmap-meta-tag">
                      <Sparkles className="h-3.5 w-3.5" /> AI Gap Evaluated
                    </span>
                  </div>
                </div>

                <div className="roadmap-readiness-panel">
                  <div className="roadmap-match-label">Target Role Match</div>
                  <div className="roadmap-match-score">{p.match_percentage}%</div>
                  <span className={`roadmap-readiness-tag ${readinessClass}`}>
                    {p.readiness_level}
                  </span>
                  <div className="roadmap-metrics-grid">
                    <div>
                      <strong className="block text-emerald-600 font-bold">{p.mastered_count}</strong>
                      <span className="text-slate-500 text-[11px]">Mastered</span>
                    </div>
                    <div>
                      <strong className="block text-sky-600 font-bold">{p.in_progress_count}</strong>
                      <span className="text-slate-500 text-[11px]">In Progress</span>
                    </div>
                    <div>
                      <strong className="block text-amber-600 font-bold">{p.gap_count}</strong>
                      <span className="text-slate-500 text-[11px]">Gaps</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phases and Milestones */}
              <div className="roadmap-phases-container">
                {phases.map((ph) => (
                  <div key={ph.name} className="roadmap-phase-section">
                    <div className="roadmap-phase-header">
                      <div className="roadmap-phase-dot" />
                      <h3>{ph.name}</h3>
                    </div>

                    <div className="roadmap-milestones-grid">
                      {ph.milestones.map((m: RoadmapMilestone) => {
                        const statusLabel =
                          m.status === "mastered"
                            ? "Mastered"
                            : m.status === "in_progress"
                            ? "In Progress"
                            : "Skill Gap";

                        return (
                          <div key={m.id} className="roadmap-card">
                            <div className="roadmap-card-header">
                              <div>
                                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                  {label(SKILL_CATEGORIES, m.category)}
                                </span>
                                <h4 className="roadmap-card-title">{m.title}</h4>
                              </div>
                              <span className={`roadmap-status-pill ${m.status}`}>
                                {statusLabel}
                              </span>
                            </div>

                            <p className="roadmap-card-desc">{m.description}</p>

                            <div className="roadmap-resources-title">Curated Free Resources</div>
                            <div className="roadmap-resources-list">
                              {m.resources.map((res: RoadmapResource, idx: number) => (
                                <a
                                  key={idx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="roadmap-resource-item"
                                >
                                  <span className="truncate">{res.title}</span>
                                  <span className="flex items-center gap-1 shrink-0 font-medium text-[11px] uppercase text-sky-600">
                                    {res.type}
                                    <ExternalLink className="h-3 w-3" />
                                  </span>
                                </a>
                              ))}
                            </div>

                            <div className="roadmap-card-footer">
                              <span className="roadmap-level-tag">
                                Target: {label(SKILL_LEVELS, m.target_level)}
                              </span>

                              {m.is_enrolled ? (
                                <span className="roadmap-action-btn enrolled">
                                  <Check className="h-3.5 w-3.5" /> Enrolled in Goals
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={enrollMutation.isPending}
                                  className="roadmap-action-btn"
                                  onClick={() =>
                                    enrollMutation.mutate({
                                      role_id: p.role_id,
                                      milestone_id: m.id,
                                      title: m.title,
                                      category: m.category,
                                      priority: "medium",
                                    })
                                  }
                                >
                                  <Plus className="h-3.5 w-3.5" /> Set as Learning Goal
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          );
        }}
      </DataState>
    </div>
  );
}
