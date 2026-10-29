import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileCheck,
  HelpCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FormDialog } from "@/components/FormDialog";
import {
  Button,
  DataState,
  EmptyState,
  PageHeader,
  SelectField,
  TextAreaField,
  TextField,
  useToast,
} from "@/components/ui";
import { api } from "@/lib/api";
import { SKILL_CATEGORIES, SKILL_LEVELS, label, options } from "@/lib/constants";
import type { GapStatus, SkillGapItem, SkillGapReport } from "@/types";
import { z } from "zod";
import "./SkillGapPage.css";

// ── Constants & Helpers ───────────────────────────────────────────────────────
const STATUS_LABELS: Record<GapStatus, string> = {
  met: "Requirement Met",
  partial: "In Progress / Partial",
  gap: "Action Needed",
  not_assessed: "Not Assessed",
};

const STATUS_ICONS: Record<GapStatus, React.ComponentType<{ className?: string }>> = {
  met: CheckCircle2,
  partial: TrendingUp,
  gap: AlertCircle,
  not_assessed: HelpCircle,
};

const STATUS_CLASSES: Record<GapStatus, string> = {
  met: "skillgap-status--met",
  partial: "skillgap-status--partial",
  gap: "skillgap-status--gap",
  not_assessed: "skillgap-status--not_assessed",
};

const CARD_STATUS_CLASSES: Record<GapStatus, string> = {
  met: "skillgap-card--met",
  partial: "skillgap-card--partial",
  gap: "skillgap-card--gap",
  not_assessed: "skillgap-card--not_assessed",
};

const EVIDENCE_LABELS: Record<string, string> = {
  assessed: "Verified Assessment",
  self_reported: "Self-Reported Skill",
  not_assessed: "No Assessment Record",
};

// ── Zod Schemas ──────────────────────────────────────────────────────────────
const goalSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1, "Choose a category"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  target_date: z.string().optional().nullable(),
});

const assessmentSchema = z.object({
  skill_name: z.string().min(1, "Skill name is required").max(80),
  category: z.string().min(1, "Choose a category"),
  score: z.coerce.number().min(0, "Score must be positive"),
  max_score: z.coerce.number().gt(0, "Max score must be greater than 0"),
  feedback: z.string().max(2000).optional().nullable(),
});

export function SkillGapPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [requiredOnly, setRequiredOnly] = useState<boolean>(false);

  const [goalTarget, setGoalTarget] = useState<SkillGapItem | null>(null);
  const [assessmentTarget, setAssessmentTarget] = useState<SkillGapItem | null>(null);

  const query = useQuery<SkillGapReport>({
    queryKey: ["student-skill-gaps"],
    queryFn: () => api.get("/students/me/skill-gaps"),
  });

  const createGoalMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.post("/goals", values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/goals"] });
      void qc.invalidateQueries({ queryKey: ["student-skill-gaps"] });
      toast("success", "Learning goal created successfully");
      setGoalTarget(null);
    },
    onError: (e: Error) => toast("error", e.message),
  });

  const createAssessmentMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.post("/skill-assessments", values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["student-skill-gaps"] });
      void qc.invalidateQueries({ queryKey: ["/skills"] });
      toast("success", "Assessment recorded successfully");
      setAssessmentTarget(null);
    },
    onError: (e: Error) => toast("error", e.message),
  });

  const filteredGaps = useMemo(() => {
    if (!query.data?.gaps) return [];
    return query.data.gaps.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (requiredOnly && !item.is_required) return false;
      return true;
    });
  }, [query.data?.gaps, categoryFilter, statusFilter, requiredOnly]);

  const report = query.data;

  return (
    <div className="skillgap-container">
      <PageHeader
        title="Skill Intelligence & Gap Analysis"
        description="Benchmark your current capabilities against curriculum requirements and target outcomes."
      />

      <DataState query={query}>
        {() => (
          <>
            {/* Banner with Department & Academic Year info */}
            <div className="skillgap-banner">
              <div className="skillgap-banner-info">
                <span className="skillgap-banner-title">
                  <Compass className="h-5 w-5 text-indigo-600" aria-hidden />
                  {report?.department_name
                    ? `${report.department_name} Curriculum Benchmark`
                    : "Department Benchmark"}
                </span>
                <span className="skillgap-banner-subtitle">
                  {report?.note ||
                    "Gap analysis dynamically synthesizes requirements, assessments, and profile evidence."}
                </span>
              </div>
              <div className="skillgap-banner-chips">
                {report?.department_name ? (
                  <span className="skillgap-chip skillgap-chip--dept">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                    {report.department_name}
                  </span>
                ) : (
                  <Link to="/profile" className="skillgap-chip skillgap-chip--dept">
                    Set Department in Profile
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                )}
                {report?.study_year && (
                  <span className="skillgap-chip skillgap-chip--year">
                    Year {report.study_year} Curriculum
                  </span>
                )}
              </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="skillgap-stats-grid">
              <div className="skillgap-stat-card">
                <span className="skillgap-stat-label">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                  Requirements Met
                </span>
                <span className="skillgap-stat-value skillgap-stat-value--met">
                  {report?.summary.met ?? 0}
                </span>
                <span className="skillgap-stat-subtext">Level achieved or exceeded</span>
              </div>

              <div className="skillgap-stat-card">
                <span className="skillgap-stat-label">
                  <TrendingUp className="h-4 w-4 text-amber-600" aria-hidden />
                  Partial Progress
                </span>
                <span className="skillgap-stat-value skillgap-stat-value--partial">
                  {report?.summary.partial ?? 0}
                </span>
                <span className="skillgap-stat-subtext">Active competency being leveled up</span>
              </div>

              <div className="skillgap-stat-card">
                <span className="skillgap-stat-label">
                  <AlertCircle className="h-4 w-4 text-rose-600" aria-hidden />
                  Skill Gaps
                </span>
                <span className="skillgap-stat-value skillgap-stat-value--gap">
                  {report?.summary.gap ?? 0}
                </span>
                <span className="skillgap-stat-subtext">High priority target deficiencies</span>
              </div>

              <div className="skillgap-stat-card">
                <span className="skillgap-stat-label">
                  <HelpCircle className="h-4 w-4 text-slate-500" aria-hidden />
                  Not Assessed
                </span>
                <span className="skillgap-stat-value skillgap-stat-value--unassessed">
                  {report?.summary.not_assessed ?? 0}
                </span>
                <span className="skillgap-stat-subtext">Requires validation or assessment</span>
              </div>
            </div>

            {/* Controls / Filter Bar */}
            <div className="skillgap-controls">
              <span className="skillgap-filter-label">Filter:</span>
              <select
                aria-label="Filter by Category"
                className="skillgap-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {options(SKILL_CATEGORIES).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by Status"
                className="skillgap-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="gap">Action Needed (Gap)</option>
                <option value="partial">In Progress (Partial)</option>
                <option value="not_assessed">Not Assessed</option>
                <option value="met">Requirement Met</option>
              </select>

              <label className="skillgap-checkbox-label">
                <input
                  type="checkbox"
                  className="skillgap-checkbox"
                  checked={requiredOnly}
                  onChange={(e) => setRequiredOnly(e.target.checked)}
                />
                Required core skills only
              </label>
            </div>

            {/* Gap Items Breakdown */}
            {!report?.department_id ? (
              <EmptyState
                title="Department Not Assigned"
                description="Assign your department in your student profile or contact your academic administrator to activate your curriculum skill tracking."
                action={
                  <Link to="/profile">
                    <Button>Go to Profile Settings</Button>
                  </Link>
                }
              />
            ) : filteredGaps.length === 0 ? (
              <EmptyState
                title="No skill requirements found"
                description={
                  report?.gaps.length === 0
                    ? "Your department has not published any skill requirements yet."
                    : "No skills match the active filter criteria."
                }
              />
            ) : (
              <ul className="skillgap-list">
                {filteredGaps.map((item) => {
                  const StatusIcon = STATUS_ICONS[item.status] ?? HelpCircle;
                  return (
                    <li key={`${item.category}-${item.skill_name}`} className={`skillgap-card ${CARD_STATUS_CLASSES[item.status]}`}>
                      <div className="skillgap-card-header">
                        <div className="skillgap-card-title-group">
                          <div className="skillgap-card-title-row">
                            <h3 className="skillgap-card-title">{item.skill_name}</h3>
                            {item.is_required && (
                              <span className="skillgap-required-tag">Core Requirement</span>
                            )}
                          </div>
                          <span className="skillgap-category-text">
                            {label(SKILL_CATEGORIES, item.category)} · Weight: {item.weight}x
                          </span>
                        </div>

                        <span className={`skillgap-status-badge ${STATUS_CLASSES[item.status]}`}>
                          <StatusIcon className="h-4 w-4" aria-hidden />
                          {STATUS_LABELS[item.status]}
                        </span>
                      </div>

                      <div className="skillgap-comparison-grid">
                        <div className="skillgap-comparison-col">
                          <span className="skillgap-comparison-label">Target Level</span>
                          <span className="skillgap-comparison-val">
                            <Award className="h-4 w-4 text-indigo-600" aria-hidden />
                            {label(SKILL_LEVELS, item.target_level)}
                          </span>
                        </div>

                        <div className="skillgap-comparison-col">
                          <span className="skillgap-comparison-label">Current Standing</span>
                          <span className="skillgap-comparison-val">
                            {item.achieved_level
                              ? label(SKILL_LEVELS, item.achieved_level)
                              : "None recorded"}
                          </span>
                          <span className="skillgap-evidence-info">
                            {EVIDENCE_LABELS[item.evidence_type] ?? item.evidence_type}
                            {item.evidence_detail ? ` (${item.evidence_detail})` : ""}
                          </span>
                        </div>

                        <div className="skillgap-comparison-col">
                          <span className="skillgap-comparison-label">Gap Differential</span>
                          <span className="skillgap-comparison-val">
                            {item.gap_size > 0 ? `-${item.gap_size} level step(s)` : "None (Met)"}
                          </span>
                        </div>
                      </div>

                      <div className="skillgap-action-box">
                        <div className="skillgap-recommendation">
                          <Sparkles className="skillgap-recommendation-icon" aria-hidden />
                          <span>
                            {item.recommended_action ||
                              (item.status === "met"
                                ? "Competency verified. Maintain skills with real-world projects."
                                : "Create a targeted learning goal or submit an assessment to close this gap.")}
                          </span>
                        </div>

                        <div className="skillgap-btn-group">
                          <Button
                            variant="secondary"
                            onClick={() => setAssessmentTarget(item)}
                          >
                            <FileCheck className="h-4 w-4" aria-hidden />
                            Submit Assessment
                          </Button>

                          <Button
                            variant="primary"
                            onClick={() => setGoalTarget(item)}
                          >
                            <Target className="h-4 w-4" aria-hidden />
                            Set Learning Goal
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </DataState>

      {/* Goal Creation Dialog */}
      <FormDialog
        title={goalTarget ? `Set Goal for ${goalTarget.skill_name}` : "Create Learning Goal"}
        open={!!goalTarget}
        onClose={() => setGoalTarget(null)}
        schema={goalSchema}
        submitLabel="Create Goal"
        successMessage="Learning goal created successfully"
        defaultValues={{
          title: goalTarget ? `Master ${goalTarget.skill_name} (${label(SKILL_LEVELS, goalTarget.target_level)})` : "",
          category: goalTarget?.category ?? "programming",
          priority: goalTarget?.is_required ? "high" : "medium",
          description: goalTarget?.recommended_action ?? "",
          target_date: "",
        }}
        onSubmit={async (values) => {
          await createGoalMutation.mutateAsync(values);
        }}
      >
        {({ register, formState: { errors } }) => (
          <div className="skillgap-modal-grid">
            <TextField
              label="Goal title"
              required
              error={errors.title as never}
              {...register("title")}
            />
            <SelectField
              label="Category"
              required
              choices={options(SKILL_CATEGORIES)}
              error={errors.category as never}
              {...register("category")}
            />
            <SelectField
              label="Priority"
              required
              choices={[
                { value: "high", label: "High Priority" },
                { value: "medium", label: "Medium Priority" },
                { value: "low", label: "Low Priority" },
              ]}
              error={errors.priority as never}
              {...register("priority")}
            />
            <TextField
              label="Target completion date"
              type="date"
              error={errors.target_date as never}
              {...register("target_date")}
            />
            <TextAreaField
              label="Action plan & notes"
              rows={3}
              error={errors.description as never}
              {...register("description")}
            />
          </div>
        )}
      </FormDialog>

      {/* Assessment Dialog */}
      <FormDialog
        title={assessmentTarget ? `Record Assessment: ${assessmentTarget.skill_name}` : "Record Assessment"}
        open={!!assessmentTarget}
        onClose={() => setAssessmentTarget(null)}
        schema={assessmentSchema}
        submitLabel="Save Assessment"
        successMessage="Assessment recorded successfully"
        defaultValues={{
          skill_name: assessmentTarget?.skill_name ?? "",
          category: assessmentTarget?.category ?? "programming",
          score: 80,
          max_score: 100,
          feedback: "",
        }}
        onSubmit={async (values) => {
          await createAssessmentMutation.mutateAsync(values);
        }}
      >
        {({ register, formState: { errors } }) => (
          <div className="skillgap-modal-grid">
            <TextField
              label="Skill name"
              required
              readOnly={!!assessmentTarget}
              error={errors.skill_name as never}
              {...register("skill_name")}
            />
            <SelectField
              label="Category"
              required
              choices={options(SKILL_CATEGORIES)}
              error={errors.category as never}
              {...register("category")}
            />
            <TextField
              label="Score earned"
              type="number"
              step="any"
              required
              error={errors.score as never}
              {...register("score")}
            />
            <TextField
              label="Maximum score"
              type="number"
              step="any"
              required
              error={errors.max_score as never}
              {...register("max_score")}
            />
            <TextAreaField
              label="Assessment notes / examiner feedback"
              rows={2}
              error={errors.feedback as never}
              {...register("feedback")}
            />
          </div>
        )}
      </FormDialog>
    </div>
  );
}
