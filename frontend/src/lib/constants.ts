import type { AchievementKind, CertStatus, GoalStatus, PlacementCategory, Priority, ProjectStatus, SkillCategory, SkillLevel } from "@/types";

export const SKILL_CATEGORIES: Record<SkillCategory, string> = {
  programming: "Programming", dsa: "Data Structures and Algorithms", ai_ml: "AI and Machine Learning", web: "Web Development",
  databases: "Databases", cloud: "Cloud Computing", tools: "Tools and Platforms", soft_skills: "Communication and Soft Skills",
};
export const SKILL_LEVELS: Record<SkillLevel, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert" };
export const CERT_STATUS: Record<CertStatus, string> = { pending: "Pending", verified: "Verified", rejected: "Rejected" };
export const PROJECT_STATUS: Record<ProjectStatus, string> = { planned: "Planned", in_progress: "In progress", completed: "Completed" };
export const ACHIEVEMENT_KINDS: Record<AchievementKind, string> = { hackathon: "Hackathon", competition: "Competition", workshop: "Workshop", internship: "Internship", research: "Research", award: "Award", other: "Other" };
export const GOAL_STATUS: Record<GoalStatus, string> = { not_started: "Not started", in_progress: "In progress", completed: "Completed" };
export const PRIORITY: Record<Priority, string> = { low: "Low", medium: "Medium", high: "High" };
export const PLACEMENT_CATEGORIES: Record<PlacementCategory, string> = {
  coding_dsa: "Coding and DSA", aptitude: "Aptitude", technical: "Technical knowledge", communication: "Communication",
  mock_interview: "Mock interviews", resume_portfolio: "Resume and portfolio preparation",
};
export const PORTFOLIO_SECTIONS: Record<string, string> = { skills: "Skills", projects: "Projects", certifications: "Verified certificates", achievements: "Achievements", resume: "Resume link" };
export const label = (map: Record<string, string>, key: string) => map[key] ?? key;
export const options = (map: Record<string, string>) => Object.entries(map).map(([value, text]) => ({ value, label: text }));

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? iso + "T00:00:00" : iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
