import { Route, Routes, Link } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout, StudentLayout } from "@/layouts";
import { LoginPage, RegisterPage } from "@/pages/AuthPages";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SkillsPage } from "@/features/skills/SkillsPage";
import { CertificationsPage } from "@/features/certifications/CertificationsPage";
import { ProjectsPage, ProjectDetailPage } from "@/features/projects/ProjectsPage";
import { AchievementsPage } from "@/features/achievements/AchievementsPage";
import { GoalsPage } from "@/features/learning-goals/GoalsPage";
import { PlacementPage } from "@/features/placement/PlacementPage";
import { PortfolioEditorPage, PublicPortfolioPage } from "@/features/portfolio/PortfolioPages";
import { AdminOverviewPage, AdminStudentsPage, AdminStudentDetailPage, AdminCertificationsPage, AdminActivityPage } from "@/features/admin/AdminPages";

function NotFound() {
  return <main className="p-10 text-center"><h1 className="text-2xl font-semibold">Page not found</h1><p className="mt-2 text-ink-soft">The page you are looking for does not exist.</p><Link to="/" className="mt-4 inline-block font-medium text-brand-600">Go to the home page</Link></main>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/portfolio/:username" element={<PublicPortfolioPage />} />
      <Route element={<ProtectedRoute role="student" />}>
        <Route element={<StudentLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="certifications" element={<CertificationsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="placement" element={<PlacementPage />} />
          <Route path="portfolio-editor" element={<PortfolioEditorPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="students/:id" element={<AdminStudentDetailPage />} />
          <Route path="certifications" element={<AdminCertificationsPage />} />
          <Route path="activity" element={<AdminActivityPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
