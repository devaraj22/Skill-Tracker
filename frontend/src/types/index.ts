export type Role = "student" | "admin";
export interface User { id: string; email: string; role: Role; is_active: boolean; full_name: string | null; created_at: string }
export interface Page<T> { items: T[]; total: number; page: number; page_size: number }

export interface Profile {
  id: string; user_id: string; email: string; full_name: string; register_number: string | null; department: string | null;
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
export interface AdminCertification extends Certification { student_id: string; student_name: string; reviewer_name: string | null }

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
  full_name: string; profile_completion: number; skills_count: number; projects_count: number; certificates_submitted: number; certificates_verified: number;
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

export interface AdminStudent { id: string; email: string; full_name: string; register_number: string | null; department: string | null; year_of_study: number | null; is_active: boolean; created_at: string }
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
