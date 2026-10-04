import { z } from "zod";

const optionalUrl = z.string().trim().max(500).refine((v) => v === "" || /^https?:\/\/[^\s/]+\.?[^\s]*$/i.test(v), "Enter a valid http(s) link");
const optionalText = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);
const requiredText = (label: string, max = 160) => z.string().trim().min(1, `${label} is required`).max(max, `Keep this under ${max} characters`);
const dateStr = (label: string) => z.string().min(1, `${label} is required`);
const passwordBytes = z.string().min(1, "Enter your password").refine((v) => new TextEncoder().encode(v).length <= 72, "Use at most 72 bytes");
const password = z.string().min(10, "Use at least 10 characters").refine((v) => new TextEncoder().encode(v).length <= 72, "Use at most 72 bytes")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Include at least one letter and one number");

export const loginSchema = z.object({ email: z.string().trim().email("Enter a valid email address"), password: passwordBytes });

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  register_number: z.string().trim().max(40).regex(/^[A-Za-z0-9/_-]*$/, "Use letters, numbers, / _ or - only"),
  department: z.string().trim().max(100),
  year_of_study: z.string().refine((v) => v === "" || (Number(v) >= 1 && Number(v) <= 6), "Choose a year between 1 and 6"),
  password,
});

export const skillSchema = z.object({
  name: requiredText("Skill name", 80), category: z.string().min(1, "Choose a category"), level: z.string().min(1, "Choose a level"),
  evidence_url: optionalUrl, notes: optionalText(1000), is_public: z.boolean(),
});

export const certificationSchema = z.object({
  title: requiredText("Title"), issuer: requiredText("Issuing organisation"), issue_date: dateStr("Issue date"),
  expiry_date: z.string(), credential_url: optionalUrl, is_public: z.boolean(),
}).refine((v) => !v.expiry_date || v.expiry_date >= v.issue_date, { path: ["expiry_date"], message: "Expiry cannot be before the issue date" });

export const projectSchema = z.object({
  title: requiredText("Title"), summary: requiredText("Summary", 300), description: optionalText(10000),
  tech_stack: z.string().max(800), repo_url: optionalUrl, demo_url: optionalUrl, cover_image_url: optionalUrl,
  start_date: z.string(), end_date: z.string(), status: z.string().min(1), is_public: z.boolean(),
}).refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, { path: ["end_date"], message: "Completion cannot be before the start date" });

export const achievementSchema = z.object({
  title: requiredText("Title"), kind: z.string().min(1, "Choose a type"), organization: requiredText("Event or organisation"),
  result: optionalText(160), description: optionalText(2000), achieved_on: dateStr("Date"), evidence_url: optionalUrl, is_public: z.boolean(),
});

export const goalSchema = z.object({
  title: requiredText("Title"), description: optionalText(1000), category: z.string().min(1, "Choose a category"), priority: z.string().min(1),
  target_date: z.string(), progress: z.coerce.number({ invalid_type_error: "Enter a number" }).int("Use a whole number").min(0, "Minimum is 0").max(100, "Maximum is 100"),
  status: z.string().min(1),
});

export const assessmentSchema = z.object({
  category: z.string().min(1, "Choose a category"), title: requiredText("Assessment title"),
  score: z.coerce.number({ invalid_type_error: "Enter a score" }).min(0, "Score cannot be negative"),
  max_score: z.coerce.number({ invalid_type_error: "Enter the maximum score" }).gt(0, "Maximum score must be above 0"),
  assessed_on: dateStr("Date"), notes: optionalText(1000),
}).refine((v) => v.score <= v.max_score, { path: ["score"], message: "Score cannot exceed the maximum score" });

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120), register_number: z.string().trim().max(40).regex(/^[A-Za-z0-9/_-]*$/, "Use letters, numbers, / _ or - only"),
  department: z.string().trim().max(100), year_of_study: z.string().refine((v) => v === "" || (Number(v) >= 1 && Number(v) <= 6), "Choose a year between 1 and 6"),
  avatar_url: optionalUrl, bio: optionalText(600),
  github_url: optionalUrl.refine((v) => v === "" || /^https?:\/\/(www\.)?github\.com\//i.test(v), "Use a github.com link"),
  linkedin_url: optionalUrl.refine((v) => v === "" || /^https?:\/\/([a-z]+\.)?linkedin\.com\//i.test(v), "Use a linkedin.com link"),
  resume_url: optionalUrl,
});

export const portfolioSchema = z.object({
  portfolio_username: z.string().trim().toLowerCase().refine((v) => v === "" || /^[a-z0-9][a-z0-9-]{2,29}$/.test(v), "Use 3-30 lowercase letters, numbers or hyphens"),
  portfolio_public: z.boolean(), portfolio_sections: z.array(z.string()),
}).refine((v) => !v.portfolio_public || v.portfolio_username !== "", { path: ["portfolio_username"], message: "Choose a username before publishing" });

/** Convert form strings to API values: blank -> null. */
export const nullify = <T extends Record<string, unknown>>(v: T): Record<string, unknown> =>
  Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === "string" && x.trim() === "" ? null : x]));
