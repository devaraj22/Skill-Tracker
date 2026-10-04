import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BarCard } from "@/components/charts";
import { Badge, Card, DataState, PageHeader, ProgressBar, Skeleton, StatCard } from "@/components/ui";
import { PlacementSummaryView } from "@/features/placement/PlacementPage";
import { api } from "@/lib/api";
import { SKILL_CATEGORIES, formatDate, label } from "@/lib/constants";
import type { Dashboard } from "@/types";

const ACTIONS: Record<string, string> = {
  "skill.created": "Added skill", "skill.updated": "Updated skill", "skill.deleted": "Deleted skill", "project.created": "Added project", "project.updated": "Updated project",
  "project.deleted": "Deleted project", "certificate.submitted": "Submitted certificate", "certificate.updated": "Updated certificate", "certificate.file_uploaded": "Uploaded certificate document",
  "certificate.verified": "Certificate verified", "certificate.rejected": "Certificate rejected", "certificate.deleted": "Deleted certificate", "achievement.created": "Added achievement",
  "achievement.updated": "Updated achievement", "achievement.deleted": "Deleted achievement", "goal.created": "Added goal", "goal.updated": "Updated goal", "goal.completed": "Completed goal",
  "goal.deleted": "Deleted goal", "assessment.recorded": "Recorded assessment", "assessment.updated": "Updated assessment", "profile.updated": "Updated profile", "account.registered": "Joined SkillTrack",
};

const Loading = () => <div className="space-y-4"><Skeleton className="h-10 w-72" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-64" /></div>;

export function DashboardPage() {
  const query = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<Dashboard>("/dashboard") });
  return (
    <DataState query={query} skeleton={<Loading />}>
      {(d) => (
        <>
          <PageHeader title={`Welcome, ${d.full_name.split(" ")[0]}`} description="Here is where your profile and preparation stand today." />
          <Card className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">Profile completion</span><span className="tabular-nums">{d.profile_completion}%</span></div>
            <ProgressBar value={d.profile_completion} label="Profile completion" />
            {d.profile_completion < 100 && <p className="mt-2 text-sm text-ink-soft">Finish your <Link to="/profile" className="font-medium text-brand-600">profile</Link> to make your portfolio stronger.</p>}
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Skills" value={d.skills_count} />
            <StatCard label="Projects" value={d.projects_count} />
            <StatCard label="Certificates submitted" value={d.certificates_submitted} />
            <StatCard label="Certificates verified" value={d.certificates_verified} hint={`of ${d.certificates_submitted} submitted`} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-medium">Learning goals</h2>
              {d.goals.total === 0 ? <p className="text-sm text-ink-soft">No goals yet. <Link to="/goals" className="font-medium text-brand-600">Set your first goal</Link>.</p> : (
                <>
                  <div className="mb-1 flex justify-between text-sm"><span>Average progress</span><span className="tabular-nums">{d.goals.average_progress}%</span></div>
                  <ProgressBar value={d.goals.average_progress ?? 0} label="Average goal progress" />
                  <p className="mt-2 text-sm text-ink-soft">{d.goals.completed} completed · {d.goals.in_progress} in progress · {d.goals.not_started} not started{d.goals.overdue > 0 && <> · <span className="text-red-600">{d.goals.overdue} overdue</span></>}</p>
                </>
              )}
              {[...d.overdue_goals, ...d.upcoming_deadlines].length > 0 && (
                <>
                  <h3 className="mb-2 mt-4 text-sm font-medium">Deadlines</h3>
                  <ul className="space-y-2 text-sm">{[...d.overdue_goals, ...d.upcoming_deadlines].map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-2"><span>{g.title}</span><span className="flex items-center gap-2">{g.is_overdue && <Badge tone="overdue">Overdue</Badge>}<span className="text-ink-soft">{formatDate(g.target_date)}</span></span></li>))}</ul>
                </>
              )}
            </Card>
            {d.skill_distribution.length === 0 ? <Card><h2 className="mb-2 font-medium">Skill distribution</h2><p className="text-sm text-ink-soft">Add skills to see how they are spread across categories. <Link to="/skills" className="font-medium text-brand-600">Add a skill</Link>.</p></Card>
              : <BarCard title="Skill distribution" horizontal height={Math.max(160, d.skill_distribution.length * 36)} xKey="name" yKey="count" data={d.skill_distribution.map((s) => ({ name: label(SKILL_CATEGORIES, s.category), count: s.count }))} />}
          </div>

          <h2 className="mb-3 mt-8 text-lg font-semibold">Placement preparation</h2>
          <PlacementSummaryView s={d.placement} />

          <Card className="mt-6">
            <h2 className="mb-3 font-medium">Recent activity</h2>
            {d.recent_activity.length === 0 ? <p className="text-sm text-ink-soft">Nothing yet. Your changes will show up here.</p> : (
              <ul className="divide-y divide-slate-100 text-sm">{d.recent_activity.map((a, i) => (
                <li key={i} className="flex justify-between gap-3 py-2"><span>{ACTIONS[a.action] ?? a.action}{a.summary && a.action !== "account.registered" ? `: ${a.summary}` : ""}</span><time className="shrink-0 text-ink-faint" dateTime={a.created_at}>{formatDate(a.created_at)}</time></li>))}</ul>
            )}
          </Card>
        </>
      )}
    </DataState>
  );
}
