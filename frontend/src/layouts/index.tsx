import { Award, BarChart3, BookOpen, ClipboardCheck, FolderGit2, Globe, LayoutDashboard, ScrollText, Target, Trophy, User, Users } from "lucide-react";
import { Shell } from "@/layouts/Shell";
import type { NavItem } from "@/layouts/Shell";

const i = "h-4 w-4";
const STUDENT: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard className={i} />, end: true },
  { to: "/profile", label: "Profile", icon: <User className={i} /> },
  { to: "/skills", label: "Skills", icon: <BookOpen className={i} /> },
  { to: "/certifications", label: "Certificates", icon: <Award className={i} /> },
  { to: "/projects", label: "Projects", icon: <FolderGit2 className={i} /> },
  { to: "/achievements", label: "Achievements", icon: <Trophy className={i} /> },
  { to: "/goals", label: "Learning goals", icon: <Target className={i} /> },
  { to: "/placement", label: "Placement prep", icon: <ClipboardCheck className={i} /> },
  { to: "/portfolio-editor", label: "Public portfolio", icon: <Globe className={i} /> },
];
const ADMIN: NavItem[] = [
  { to: "/admin", label: "Overview", icon: <BarChart3 className={i} />, end: true },
  { to: "/admin/students", label: "Students", icon: <Users className={i} /> },
  { to: "/admin/certifications", label: "Certificate queue", icon: <Award className={i} /> },
  { to: "/admin/activity", label: "Audit log", icon: <ScrollText className={i} /> },
];
export const StudentLayout = () => <Shell items={STUDENT} title="Student" />;
export const AdminLayout = () => <Shell items={ADMIN} title="Administrator" />;
