import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ActivityHeatmap } from "@/components/activity/ActivityHeatmap";
import { BadgesShowcase } from "@/components/activity/BadgesShowcase";
import { RoadmapPage } from "@/features/roadmap/RoadmapPage";
import { mockApi, renderApp, student } from "@/test/utils";
import type { ActivityHeatmapData, BadgesSummary, RoadmapPlan, RoleOverview } from "@/types";

describe("Roadmap and Gamification components", () => {
  it("renders activity heatmap with streaks and contributions", () => {
    const heatmapData: ActivityHeatmapData = {
      current_streak: 5,
      longest_streak: 12,
      total_activities: 48,
      active_days: 22,
      daily_counts: { "2026-10-18": 3, "2026-10-17": 2 },
      start_date: "2025-10-19",
      end_date: "2026-10-18",
    };

    renderApp(<ActivityHeatmap data={heatmapData} />);
    expect(screen.getByText("Learning Activity & Streaks")).toBeInTheDocument();
    expect(screen.getByText("Current Streak")).toBeInTheDocument();
    expect(screen.getByText("5 days")).toBeInTheDocument();
    expect(screen.getByText("12 days")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
  });

  it("renders badges showcase and filters", async () => {
    const user = userEvent.setup();
    const badgesData: BadgesSummary = {
      unlocked_count: 1,
      total_count: 2,
      completion_percentage: 50,
      badges: [
        {
          id: "first_step",
          title: "First Step",
          description: "Add your first skill",
          category: "skills",
          tier: "bronze",
          icon: "Sparkles",
          unlocked: true,
          progress: 100,
          current_value: 1,
          target_value: 1,
          unlocked_at: null,
        },
        {
          id: "streak_7",
          title: "Streak Master",
          description: "Maintain 7 day streak",
          category: "activity",
          tier: "silver",
          icon: "Zap",
          unlocked: false,
          progress: 40,
          current_value: 3,
          target_value: 7,
          unlocked_at: null,
        },
      ],
    };

    renderApp(<BadgesShowcase data={badgesData} />);
    expect(screen.getByText("Skill & Milestone Badges")).toBeInTheDocument();
    expect(screen.getByText("First Step")).toBeInTheDocument();
    expect(screen.getByText("Streak Master")).toBeInTheDocument();

    // Click Unlocked filter
    await user.click(screen.getByRole("button", { name: /unlocked/i }));
    expect(screen.getByText("First Step")).toBeInTheDocument();
    expect(screen.queryByText("Streak Master")).not.toBeInTheDocument();
  });

  it("renders roadmap page with career roles and allows goal enrollment", async () => {
    const user = userEvent.setup();
    const roles: RoleOverview[] = [
      {
        id: "fullstack_web",
        title: "Full-Stack Web Developer",
        description: "Modern web stack",
        icon: "Layout",
        estimated_duration: "4–6 Months",
        milestones_count: 1,
      },
    ];

    const plan: RoadmapPlan = {
      role_id: "fullstack_web",
      role_title: "Full-Stack Web Developer",
      role_description: "Modern web stack",
      icon: "Layout",
      match_percentage: 60,
      readiness_level: "Developing",
      mastered_count: 0,
      in_progress_count: 1,
      gap_count: 0,
      milestones: [
        {
          id: "m1",
          title: "React & Component Architecture",
          category: "web",
          target_level: "advanced",
          phase: 1,
          phase_name: "Phase 1: Foundations",
          description: "Master React components",
          status: "in_progress",
          current_level: "intermediate",
          resources: [{ title: "React Docs", url: "https://react.dev", type: "docs", is_free: true }],
          is_enrolled: false,
          enrolled_goal_id: null,
        },
      ],
    };

    mockApi(({ path, method }) => {
      if (path === "/roadmap/roles") return { json: roles };
      if (path.startsWith("/roadmap/plan")) return { json: plan };
      if (path === "/roadmap/enroll" && method === "POST") {
        return {
          json: {
            id: "g1",
            title: "React & Component Architecture",
            category: "web",
            priority: "medium",
            status: "not_started",
            progress: 0,
          },
        };
      }
      return { json: student };
    });

    renderApp(<RoadmapPage />);
    expect(await screen.findByText("AI Learning Roadmap & Resource Guides")).toBeInTheDocument();
    expect(await screen.findAllByText("Full-Stack Web Developer")).toHaveLength(2);
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("React & Component Architecture")).toBeInTheDocument();
    expect(screen.getByText("React Docs")).toBeInTheDocument();

    const enrollBtn = screen.getByRole("button", { name: /set as learning goal/i });
    expect(enrollBtn).toBeInTheDocument();
    await user.click(enrollBtn);
  });
});
