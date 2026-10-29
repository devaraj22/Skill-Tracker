export type Role = "student" | "admin" | "faculty" | "coordinator";
export interface User { id: string; email: string; role: Role; is_active: boolean; full_name: string | null; created_at: string }
export interface Page<T> { items: T[]; total: number; page: number; page_size: number }

export interface Profile {
  id: string; user_id: string; email: string; full_name: string; register_number: string | null; department: string | null;
  department_id: string | null;
  department_code?: string | null;
  year_of_study: number | null; avatar_url: string | null; bio: string | null; github_url: string | null; linkedin_url: string | null;
  resume_url: string | null; portfolio_username: string | null; portfolio_public: boolean; portfolio_sections: string[];
  completion_percent: number; updated_at: string;
}

export type SkillCategory = "programming" | "dsa" | "ai_ml" | "web" | "databases" | "cloud" | "tools" | "soft_skills";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";
export interface Skill { id: string; name: string; category: SkillCategory; level: SkillLevel; evidence_url: string | null; notes: string | null; is_public: boolean; created_at: string; updated_at: string }

export type CertStatus = "pending" | "verified" | "rejected";
export interface Certification {
  id: string; title: string; issuer: string; issue_date: string; expiry_date: string | null; credential_url: string | null;
  status: CertStatus; is_public: boolean; has_file: boolean; file_size: number | null; reviewed_at: string | null; review_notes: string | null;
  created_at: string; updated_at: string;
}
export interface AdminCertification extends Certification {
  student_id: string;
  student_name: string;
  student_register_number?: string | null;
  student_department?: string | null;
  student_year?: number | null;
  file_mime?: string | null;
  reviewer_name: string | null;
}

export interface PublicVerification {
  id: string;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  credential_url: string | null;
  status: CertStatus;
  is_verified: boolean;
  student_name: string;
  department: string | null;
  verified_at: string | null;
}

export type ProjectStatus = "planned" | "in_progress" | "completed";
export interface Project {
  id: string; title: string; summary: string; description: string | null; tech_stack: string[]; repo_url: string | null; demo_url: string | null;
  cover_image_url: string | null; start_date: string | null; end_date: string | null; status: ProjectStatus; is_public: boolean; position: number;
}

export type AchievementKind = "hackathon" | "competition" | "workshop" | "internship" | "research" | "award" | "other";
export interface Achievement { id: string; title: string; kind: AchievementKind; organization: string; result: string | null; description: string | null; achieved_on: string; evidence_url: string | null; is_public: boolean }

export type GoalStatus = "not_started" | "in_progress" | "completed";
export type Priority = "low" | "medium" | "high";
export interface Goal { id: string; title: string; description: string | null; category: SkillCategory; priority: Priority; target_date: string | null; progress: number; status: GoalStatus; is_overdue: boolean }

export type PlacementCategory = "coding_dsa" | "aptitude" | "technical" | "communication" | "mock_interview" | "resume_portfolio";
export interface Assessment { id: string; category: PlacementCategory; title: string; score: number; max_score: number; percent: number; assessed_on: string; notes: string | null }
export interface PlacementSummary {
  categories: { category: PlacementCategory; label: string; has_data: boolean; latest_percent: number | null; latest_title: string | null; latest_date: string | null; assessment_count: number }[];
  overall_percent: number | null; categories_with_data: number; categories_total: number; missing_categories: string[]; formula: string;
  history: Record<string, { date: string; percent: number; title: string }[]>;
  checklist: { key: string; label: string; done: boolean }[]; next_steps: string[];
}
export interface GoalBrief { id: string; title: string; target_date: string; progress: number; is_overdue: boolean }
export interface Dashboard {
  full_name: string;
  department?: string | null;
  department_code?: string | null;
  year_of_study?: number | null;
  register_number?: string | null;
  profile_completion: number;
  skills_count: number;
  projects_count: number;
  certificates_submitted: number;
  certificates_verified: number;
  goals: { total: number; completed: number; in_progress: number; not_started: number; overdue: number; average_progress: number | null };
  upcoming_deadlines: GoalBrief[]; overdue_goals: GoalBrief[]; skill_distribution: { category: SkillCategory; count: number }[];
  placement: PlacementSummary; recent_activity: { action: string; entity_type: string; summary: string | null; created_at: string }[];
}

export interface PublicPortfolio {
  username: string; full_name: string; bio: string | null; avatar_url: string | null; github_url: string | null; linkedin_url: string | null; resume_url: string | null;
  sections: string[];
  skills: { name: string; category: string; level: string }[];
  projects: { id: string; title: string; summary: string; description: string | null; tech_stack: string[]; repo_url: string | null; demo_url: string | null; cover_image_url: string | null; status: string }[];
  certifications: { title: string; issuer: string; issue_date: string; expiry_date: string | null; credential_url: string | null }[];
  achievements: { title: string; kind: string; organization: string; result: string | null; description: string | null; achieved_on: string; evidence_url: string | null }[];
}

export interface AdminStudent {
  id: string; email: string; full_name: string; register_number: string | null;
  department: string | null; department_id: string | null;
  year_of_study: number | null; is_active: boolean; created_at: string;
}
export interface AdminStudentDetail extends AdminStudent {
  counts: Record<string, number>; skills: { name: string; category: string; level: string }[]; certifications: Certification[];
  goals: { title: string; status: string; progress: number; target_date: string | null }[]; placement: PlacementSummary;
}
export interface AdminAnalytics {
  students: { active: number; inactive: number; total: number };
  by_department: { department: string; count: number }[]; by_year: { year: number | null; count: number }[];
  certifications: Record<string, number>; skill_distribution: { category: string; count: number }[];
  learning: { total_goals: number; average_progress: number | null; by_status: Record<string, number> };
  placement: { category: string; label: string; average_percent: number; assessments: number; students: number }[]; placement_note: string;
}
export interface ActivityLogEntry { id: string; created_at: string; actor_email: string | null; action: string; entity_type: string; entity_id: string | null; subject_user_id: string | null; summary: string | null }

// ── New types (Milestone 1) ──────────────────────────────────────────────────

export type SchoolGroup = "soc" | "non_soc";

export interface Department {
  id: string; code: string; name: string; school_group: SchoolGroup; is_active: boolean;
  created_at: string; updated_at: string;
}

export interface StaffAssignment {
  id: string; user_id: string; department_id: string; assignment_role: "faculty" | "coordinator";
  is_active: boolean; user_email: string | null; user_name: string | null; department_name: string | null;
  created_at: string;
}

export interface SkillRequirement {
  id: string; department_id: string; skill_name: string; category: SkillCategory;
  target_level: SkillLevel; study_year: number | null; weight: number; is_required: boolean;
  created_at: string; updated_at: string;
}

export interface SkillAssessmentRecord {
  id: string; user_id: string; skill_name: string; category: SkillCategory;
  score: number; max_score: number; percent: number; assessed_by_id: string | null;
  assessed_at: string; feedback: string | null; created_at: string;
}

export type GapStatus = "met" | "partial" | "gap" | "not_assessed";

export interface SkillGapItem {
  skill_name: string; category: SkillCategory; target_level: SkillLevel;
  achieved_level: SkillLevel | null; evidence_type: "assessed" | "self_reported" | "not_assessed";
  evidence_detail: string | null; gap_size: number; status: GapStatus;
  is_required: boolean; weight: number; recommended_action: string | null;
}

export interface SkillGapReport {
  department_id: string | null; department_name: string | null; study_year: number | null;
  gaps: SkillGapItem[];
  summary: { met: number; partial: number; not_assessed: number; gap: number };
  note: string;
}

// ── Gamification Types ───────────────────────────────────────────────────────

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tier: BadgeTier;
  icon: string;
  unlocked: boolean;
  progress: number;
  current_value: number;
  target_value: number;
  unlocked_at: string | null;
}

export interface BadgesSummary {
  unlocked_count: number;
  total_count: number;
  completion_percentage: number;
  badges: BadgeItem[];
}

export interface ActivityHeatmapData {
  current_streak: number;
  longest_streak: number;
  total_activities: number;
  active_days: number;
  daily_counts: Record<string, number>;
  start_date: string;
  end_date: string;
}

export interface GamificationSummary {
  heatmap: ActivityHeatmapData;
  badges: BadgesSummary;
}

// ── Roadmap Types ────────────────────────────────────────────────────────────

export interface RoleOverview {
  id: string;
  title: string;
  description: string;
  icon: string;
  estimated_duration: string;
  milestones_count: number;
}

export type RoadmapResourceType = "docs" | "course" | "tutorial" | "guide" | "roadmap" | "practice";

export interface RoadmapResource {
  title: string;
  url: string;
  type: RoadmapResourceType;
  is_free: boolean;
}

export type MilestoneStatus = "mastered" | "in_progress" | "gap";

export interface RoadmapMilestone {
  id: string;
  title: string;
  category: SkillCategory;
  target_level: SkillLevel;
  phase: number;
  phase_name: string;
  description: string;
  status: MilestoneStatus;
  current_level: SkillLevel | null;
  resources: RoadmapResource[];
  is_enrolled: boolean;
  enrolled_goal_id: string | null;
}

export interface RoadmapPlan {
  role_id: string;
  role_title: string;
  role_description: string;
  icon: string;
  match_percentage: number;
  readiness_level: "Beginner" | "Developing" | "Industry Ready";
  mastered_count: number;
  in_progress_count: number;
  gap_count: number;
  milestones: RoadmapMilestone[];
}

export interface EnrollRoadmapGoalPayload {
  role_id: string;
  milestone_id: string;
  title: string;
  category: SkillCategory;
  priority: Priority;
  target_date?: string;
}


