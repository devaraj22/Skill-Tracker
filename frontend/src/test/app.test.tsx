import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "@/App";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminCertificationsPage } from "@/features/admin/AdminPages";
import { PublicPortfolioPage } from "@/features/portfolio/PortfolioPages";
import { SkillsPage } from "@/features/skills/SkillsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage, RegisterPage } from "@/pages/AuthPages";
import { admin, mockApi, page, renderApp, student } from "@/test/utils";

const skill = { id: "s1", name: "Python", category: "programming", level: "beginner", evidence_url: null, notes: null, is_public: true, created_at: "", updated_at: "" };

describe("form validation", () => {
  it("shows field errors and does not call the API for an invalid registration", async () => {
    const calls = mockApi(({ path }) => (path === "/auth/me" ? { status: 401, json: { detail: "no" } } : undefined));
    renderApp(<RegisterPage />);
    await userEvent.type(await screen.findByLabelText(/^email$/i), "not-an-email");
    await userEvent.type(screen.getByLabelText(/^password$/i), "alllettersonly");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Include at least one letter and one number")).toBeInTheDocument();
    expect(screen.getByText("Enter your full name")).toBeInTheDocument();
    expect(calls.some((c) => c.path === "/auth/register")).toBe(false);
  });

  it("shows the server error when login fails", async () => {
    mockApi(({ path }) => (path === "/auth/me" ? { status: 401, json: { detail: "no" } } : path === "/auth/login" ? { status: 401, json: { detail: "Invalid email or password" } } : undefined));
    renderApp(<LoginPage />);
    await userEvent.type(await screen.findByLabelText(/email/i), "a@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });
});

describe("protected routes", () => {
  const tree = (
    <Routes>
      <Route path="/login" element={<p>login page</p>} />
      <Route element={<ProtectedRoute role="student" />}><Route path="/secret" element={<p>student area</p>} /></Route>
      <Route path="/admin" element={<p>admin home</p>} />
    </Routes>
  );
  it("redirects anonymous visitors to login", async () => {
    mockApi(({ path }) => (path === "/auth/me" ? { status: 401, json: { detail: "no" } } : undefined));
    renderApp(tree, { route: "/secret" });
    expect(await screen.findByText("login page")).toBeInTheDocument();
  });
  it("renders for the right role", async () => {
    mockApi(({ path }) => (path === "/auth/me" ? { json: student } : undefined));
    renderApp(tree, { route: "/secret" });
    expect(await screen.findByText("student area")).toBeInTheDocument();
  });
  it("sends an administrator away from student routes", async () => {
    mockApi(({ path }) => (path === "/auth/me" ? { json: admin } : undefined));
    renderApp(tree, { route: "/secret" });
    expect(await screen.findByText("admin home")).toBeInTheDocument();
  });
  it("full app: anonymous user opening the dashboard lands on the sign-in form", async () => {
    mockApi(({ path }) => (path === "/auth/me" ? { status: 401, json: { detail: "no" } } : undefined));
    renderApp(<App />, { route: "/" });
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });
});

describe("skills", () => {
  it("shows loading, then an empty state", async () => {
    mockApi(({ path }) => (path === "/auth/me" ? { json: student } : path === "/skills" ? { json: page([]) } : undefined));
    renderApp(<SkillsPage />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(await screen.findByText("No skills yet")).toBeInTheDocument();
  });

  it("shows an error with retry when the API fails", async () => {
    let fail = true;
    mockApi(({ path }) => (path === "/skills" ? (fail ? { status: 500, json: { detail: "Something went wrong. Please try again." } } : { json: page([skill]) }) : { json: student }));
    renderApp(<SkillsPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
    fail = false;
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Python")).toBeInTheDocument();
  });

  it("validates, creates a skill, and refreshes the list from the server", async () => {
    let skills: unknown[] = [];
    const calls = mockApi(({ method, path, body }) => {
      if (path === "/skills" && method === "POST") { skills = [{ ...skill, ...(body as object) }]; return { status: 201, json: skills[0] }; }
      if (path === "/skills") return { json: page(skills) };
      return { json: student };
    });
    renderApp(<SkillsPage />);
    await userEvent.click(await screen.findByRole("button", { name: /add your first skill/i }));
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: /add skill/i }));
    expect(await within(dialog).findByText("Skill name is required")).toBeInTheDocument();
    expect(calls.some((c) => c.method === "POST")).toBe(false);

    await userEvent.type(within(dialog).getByLabelText("Skill name"), "Rust");
    await userEvent.selectOptions(within(dialog).getByLabelText("Category"), "programming");
    await userEvent.selectOptions(within(dialog).getByLabelText(/level/i), "advanced");
    await userEvent.click(within(dialog).getByRole("button", { name: /add skill/i }));

    expect(await screen.findByText("Rust")).toBeInTheDocument(); // came back from the (mock) server list, not local state
    expect(calls.find((c) => c.method === "POST")?.body).toMatchObject({ name: "Rust", category: "programming", level: "advanced", evidence_url: null });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("edits a skill with a PATCH", async () => {
    const calls = mockApi(({ method, path }) => (path === "/skills/s1" && method === "PATCH" ? { json: { ...skill, level: "expert" } } : path === "/skills" ? { json: page([skill]) } : { json: student }));
    renderApp(<SkillsPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Edit Python" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.selectOptions(within(dialog).getByLabelText(/level/i), "expert");
    await userEvent.click(within(dialog).getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(calls.find((c) => c.method === "PATCH" && c.path === "/skills/s1")?.body).toMatchObject({ level: "expert", name: "Python" }));
  });

  it("asks for confirmation before deleting", async () => {
    const calls = mockApi(({ method, path }) => (path === "/skills/s1" && method === "DELETE" ? { status: 204 } : path === "/skills" ? { json: page([skill]) } : { json: student }));
    renderApp(<SkillsPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Delete Python" }));
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(calls.some((c) => c.method === "DELETE" && c.path === "/skills/s1")).toBe(true));
  });
});

describe("certificate review", () => {
  const cert = { id: "c1", title: "Cloud Basics", issuer: "Acme", issue_date: "2025-01-01", expiry_date: null, credential_url: "https://example.com/v", status: "pending", is_public: false, has_file: true, file_size: 10, reviewed_at: null, review_notes: null, created_at: "", updated_at: "", student_id: "u1", student_name: "Alice Demo", reviewer_name: null };

  it("lists pending submissions and sends the decision with notes", async () => {
    const calls = mockApi(({ method, path }) => (path === "/admin/certifications/c1/review" && method === "PATCH" ? { json: { ...cert, status: "verified" } } : path === "/admin/certifications" ? { json: page([cert]) } : { json: admin }));
    renderApp(<AdminCertificationsPage />);
    expect(await screen.findByText("Alice Demo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download document" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /review cloud basics/i }));
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: /save decision/i }));
    expect(await within(dialog).findByText("Choose a decision")).toBeInTheDocument();
    await userEvent.selectOptions(within(dialog).getByLabelText("Decision"), "verified");
    await userEvent.type(within(dialog).getByLabelText(/review notes/i), "Checked with issuer");
    await userEvent.click(within(dialog).getByRole("button", { name: /save decision/i }));
    await waitFor(() => expect(calls.find((c) => c.path === "/admin/certifications/c1/review")?.body).toEqual({ status: "verified", notes: "Checked with issuer" }));
  });

  it("shows the queue-clear empty state", async () => {
    mockApi(({ path }) => (path === "/admin/certifications" ? { json: page([]) } : { json: admin }));
    renderApp(<AdminCertificationsPage />);
    expect(await screen.findByText("Queue is clear")).toBeInTheDocument();
  });
});

describe("public portfolio", () => {
  const portfolio = {
    username: "alice-demo", full_name: "Alice Demo", bio: "Hello", avatar_url: null, github_url: "https://github.com/alice", linkedin_url: null, resume_url: null,
    sections: ["skills", "projects"], skills: [{ name: "Python", category: "programming", level: "advanced" }], certifications: [], achievements: [],
    projects: [{ id: "p1", title: "Public project", summary: "Visible", description: null, tech_stack: ["Go"], repo_url: "javascript:alert(1)", demo_url: "https://example.com/demo", cover_image_url: null, status: "completed" }],
  };
  const tree = <Routes><Route path="/portfolio/:username" element={<PublicPortfolioPage />} /></Routes>;

  it("renders only published content and never renders unsafe links", async () => {
    mockApi(() => ({ json: portfolio }));
    renderApp(tree, { route: "/portfolio/alice-demo", withAuth: false });
    expect(await screen.findByRole("heading", { name: "Alice Demo" })).toBeInTheDocument();
    expect(screen.getByText("Public project")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Live demo" })).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.queryByRole("link", { name: "Repository" })).not.toBeInTheDocument(); // javascript: URL is dropped
    expect(screen.queryByText(/verified certificates/i)).not.toBeInTheDocument();
  });

  it("shows a neutral message for unknown or unpublished portfolios", async () => {
    mockApi(() => ({ status: 404, json: { detail: "Portfolio not found or not published" } }));
    renderApp(tree, { route: "/portfolio/nobody", withAuth: false });
    expect(await screen.findByRole("heading", { name: /portfolio not available/i })).toBeInTheDocument();
  });
});

describe("dashboard", () => {
  const empty = {
    full_name: "Alice Demo", profile_completion: 40, skills_count: 0, projects_count: 0, certificates_submitted: 0, certificates_verified: 0,
    goals: { total: 0, completed: 0, in_progress: 0, not_started: 0, overdue: 0, average_progress: null }, upcoming_deadlines: [], overdue_goals: [], skill_distribution: [], recent_activity: [],
    placement: { categories: [], overall_percent: null, categories_with_data: 0, categories_total: 6, missing_categories: [], formula: "Preparation indicator only.", history: {}, checklist: [{ key: "bio", label: "Write a short biography", done: false }], next_steps: ["Record your first Aptitude assessment."] },
  };
  it("renders backend values and friendly empty states", async () => {
    mockApi(({ path }) => (path === "/dashboard" ? { json: { ...empty, skills_count: 3, certificates_submitted: 2, certificates_verified: 1 } } : { json: student }));
    renderApp(<DashboardPage />);
    expect(await screen.findByRole("heading", { name: "Welcome, Alice" })).toBeInTheDocument();
    expect(screen.getByText("Skills").nextElementSibling).toHaveTextContent("3");
    expect(screen.getByText("of 2 submitted")).toBeInTheDocument();
    expect(screen.getByText("No data yet")).toBeInTheDocument();
    expect(screen.getByText("Record your first Aptitude assessment.")).toBeInTheDocument();
    expect(screen.getByText(/no goals yet/i)).toBeInTheDocument();
  });
  it("offers a retry when the dashboard fails to load", async () => {
    mockApi(({ path }) => (path === "/dashboard" ? { status: 500, json: { detail: "Something went wrong. Please try again." } } : { json: student }));
    renderApp(<DashboardPage />);
    expect(await screen.findByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
