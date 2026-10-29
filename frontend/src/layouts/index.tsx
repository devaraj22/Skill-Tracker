import { Award, BarChart3, BookOpen, Building2, ClipboardCheck, Compass, FolderGit2, Globe, LayoutDashboard, ScrollText, Sparkles, Target, Trophy, User, Users } from "lucide-react";
import { Shell } from "@/layouts/Shell";
import type { NavItem } from "@/layouts/Shell";

const i = "h-4 w-4";
const STUDENT: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className={i} />, end: true },
  { to: "/profile", label: "Profile", icon: <User className={i} /> },
  { to: "/skills", label: "Skills", icon: <BookOpen className={i} /> },
  { to: "/skill-gap", label: "Skill Gap Analysis", icon: <Sparkles className={i} /> },
  { to: "/roadmap", label: "Learning Roadmap", icon: <Compass className={i} /> },
  { to: "/certifications", label: "Certificates", icon: <Award className={i} /> },
  { to: "/projects", label: "Projects", icon: <FolderGit2 className={i} /> },
  { to: "/achievements", label: "Achievements", icon: <Trophy className={i} /> },
  { to: "/goals", label: "Learning Goals", icon: <Target className={i} /> },
  { to: "/placement", label: "Placement Prep", icon: <ClipboardCheck className={i} /> },
  { to: "/portfolio-editor", label: "Public Portfolio", icon: <Globe className={i} /> },
  { to: "/landing", label: "Campus & Departments", icon: <Building2 className={i} /> },
];
const ADMIN: NavItem[] = [
  { to: "/admin", label: "Overview", icon: <BarChart3 className={i} />, end: true },
  { to: "/admin/departments", label: "Departments", icon: <Building2 className={i} /> },
  { to: "/admin/students", label: "Students", icon: <Users className={i} /> },
  { to: "/admin/certifications", label: "Certificate Queue", icon: <Award className={i} /> },
  { to: "/admin/activity", label: "Audit Logs", icon: <ScrollText className={i} /> },
  { to: "/landing", label: "Campus & Catalog", icon: <Globe className={i} /> },
];
export const StudentLayout = () => <Shell items={STUDENT} title="Student" />;
export const AdminLayout = () => <Shell items={ADMIN} title="Administrator" />;
