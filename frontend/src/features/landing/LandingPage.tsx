import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Compass,
  ExternalLink,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogIn,
  Menu,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { SSMIET_DEPARTMENTS, type DepartmentInfo } from "./departmentsData";
import { DepartmentCard } from "./DepartmentCard";
import type { Department, PublicVerification } from "@/types";

export function LandingPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Certificate Verification Lookup State
  const [certInputId, setCertInputId] = useState("");
  const [lookupQueryId, setLookupQueryId] = useState<string | null>(null);

  // Live Departments from API (with fallback to SSMIET_DEPARTMENTS static metadata)
  const { data: apiDepartments } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => api.get<Department[]>("/departments"),
  });

  // Verification Query (safe public check)
  const {
    data: verificationData,
    isLoading: isVerifying,
    error: verificationError,
    isFetched: hasVerified,
  } = useQuery<PublicVerification>({
    queryKey: ["verify-cert", lookupQueryId],
    queryFn: () => api.get<PublicVerification>(`/certifications/verify/${lookupQueryId}`),
    enabled: !!lookupQueryId,
    retry: false,
  });

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = certInputId.trim();
    if (cleanId) {
      setLookupQueryId(cleanId);
    }
  };

  // Merge live departments with our rich curriculum data
  const departmentsList: DepartmentInfo[] = useMemo(() => {
    if (!apiDepartments || apiDepartments.length === 0) {
      return SSMIET_DEPARTMENTS;
    }

    return SSMIET_DEPARTMENTS.map((dept) => {
      const match = apiDepartments.find(
        (ad) => ad.code.toUpperCase() === dept.code.toUpperCase() || ad.name.toLowerCase() === dept.name.toLowerCase()
      );
      if (match) {
        return {
          ...dept,
          name: match.name,
          code: match.code,
          schoolGroup: match.school_group,
        };
      }
      return dept;
    });
  }, [apiDepartments]);

  const filteredDepts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return departmentsList.filter((dept) => {
      const matchCat =
        selectedCategory === "ALL" ||
        (selectedCategory === "soc" && dept.schoolGroup === "soc") ||
        (selectedCategory === "non_soc" && dept.schoolGroup === "non_soc") ||
        dept.category === selectedCategory;

      if (!matchCat) return false;
      if (!q) return true;
      return (
        dept.name.toLowerCase().includes(q) ||
        dept.code.toLowerCase().includes(q) ||
        dept.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [departmentsList, selectedCategory, search]);

  const portalRoute = useMemo(() => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "faculty" || user.role === "coordinator") return "/admin";
    return "/dashboard";
  }, [user]);

  const portalLabel = useMemo(() => {
    if (!user) return "Student Portal";
    if (user.role === "admin") return "Admin Console";
    if (user.role === "coordinator") return "Coordinator Portal";
    if (user.role === "faculty") return "Faculty Portal";
    return "Student Dashboard";
  }, [user]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-navy-900 selection:text-white">
      {/* ── TOP NAV BAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-black tracking-tight text-sm shadow-xs">
              SSM
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                <span className="text-red-600 font-extrabold">SSM</span> <span className="text-navy-900">SkillTrack</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </span>
              <span className="text-xs font-medium text-slate-500 hidden sm:block">
                (An Autonomous Institution) · Dindigul
              </span>
            </div>
          </Link>

          {/* Navigation Links - Clean, single-word labels, no redundant options */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <a
              href="#departments"
              className="px-3 py-1.5 rounded-md hover:text-navy-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Departments
            </a>
            <a
              href="#features"
              className="px-3 py-1.5 rounded-md hover:text-navy-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Features
            </a>
            <a
              href="#verification"
              className="px-3 py-1.5 rounded-md hover:text-navy-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Verification
            </a>
            <a
              href="#about"
              className="px-3 py-1.5 rounded-md hover:text-navy-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              About
            </a>
          </nav>

          {/* Action Buttons - whitespace-nowrap, single-line, perfectly aligned */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {user ? (
              <Link
                to={portalRoute}
                className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-950 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all whitespace-nowrap"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>{portalLabel}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-navy-900 hover:bg-slate-50 rounded-lg transition-all border border-slate-300 whitespace-nowrap"
                >
                  <LogIn className="h-4 w-4 text-slate-500" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs hover:shadow transition-all whitespace-nowrap"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Student Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-md">
            <a
              href="#departments"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-700 hover:text-navy-900 font-medium py-1.5"
            >
              Departments
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-700 hover:text-navy-900 font-medium py-1.5"
            >
              Features
            </a>
            <a
              href="#verification"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-700 hover:text-navy-900 font-medium py-1.5"
            >
              Certificate Verification
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-700 hover:text-navy-900 font-medium py-1.5"
            >
              About SSMIET
            </a>
            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              {user ? (
                <Link
                  to={portalRoute}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-navy-900 text-white font-semibold rounded-lg text-sm"
                >
                  {portalLabel}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 bg-amber-600 text-white font-semibold rounded-lg text-sm"
                  >
                    Student Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-blue-50/40 via-white to-slate-50/50 text-slate-900 py-14 sm:py-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-navy-900 text-white text-xs font-semibold shadow-xs border-r-4 border-amber-500 hover:shadow-sm transition-all duration-300 animate-fadeInUp">
                <GraduationCap className="h-4 w-4 text-amber-400" />
                <span>SSM Institute of Engineering and Technology · (An Autonomous Institution)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.2] animate-fadeInUp">
                Build Skills. Prove Achievements. <span className="text-navy-900 block mt-1">Get Career Ready.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                A verified student intelligence and placement enablement platform for SSMIET. Track core competencies, submit verified certificates for institutional review, and measure readiness for Anna University placements.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to={user ? portalRoute : "/register"}
                  className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-950 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 whitespace-nowrap border-b-2 border-amber-500 group"
                >
                  <span>{user ? `Go to ${portalLabel}` : "Explore Student Portal"}</span>
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>

                <a
                  href="#departments"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-slate-700 hover:text-navy-900 bg-white hover:bg-slate-50 hover:border-slate-400 hover:shadow-xs active:scale-[0.98] border border-slate-300 transition-all duration-200 whitespace-nowrap group"
                >
                  <BookOpen className="h-4 w-4 text-navy-900 group-hover:scale-110 transition-transform duration-200" />
                  <span>Explore 10 Departments</span>
                </a>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-navy-900" />
                  <span className="font-medium">10 Engineering Disciplines</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-red-600" />
                  <span className="font-medium">NAAC & NBA Accredited</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">Anna Univ. Matrix Analytics</span>
                </div>
              </div>
            </div>

            {/* Right Card: Professional Academic Student Card */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out p-5 sm:p-6 text-slate-900 animate-fadeInUp">
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      KK
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 block leading-tight">
                        K. Karthik · Final Year B.E.
                      </span>
                      <span className="text-xs text-slate-500 mt-0.5 block">Computer Science & Engineering</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 whitespace-nowrap shadow-2xs inline-flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Placement Ready
                  </span>
                </div>

                {/* Competencies Progress */}
                <div className="space-y-3.5 pt-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800">Data Structures & Algorithms</span>
                      <span className="text-xs font-bold text-navy-900">88% · Advanced</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-navy-900 h-full w-[88%] rounded-full transition-all duration-1000 ease-out" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800">Full-Stack Application Development</span>
                      <span className="text-xs font-bold text-amber-700">75% · Proficient</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[75%] rounded-full transition-all duration-1000 ease-out" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800">System Design & Cloud Architecture</span>
                      <span className="text-xs font-bold text-navy-900">70% · Intermediate</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-navy-900 h-full w-[70%] rounded-full transition-all duration-1000 ease-out" />
                    </div>
                  </div>

                  {/* Summary Metric Tiles */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-lg text-xs">
                      <div className="text-slate-500 font-medium">Verified Credentials</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">4 Certificates</div>
                      <div className="text-xs text-navy-900 font-semibold mt-0.5">Audited by Faculty</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-lg text-xs">
                      <div className="text-slate-500 font-medium">Placement Score</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">85 / 100 Score</div>
                      <div className="text-xs text-amber-700 font-semibold mt-0.5">Anna Univ. Ready</div>
                    </div>
                  </div>

                  {/* Verification Note */}
                  <div className="p-2.5 rounded-lg bg-navy-50/70 border border-navy-100 flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-navy-900 shrink-0" />
                    <span>Verified by SSMIET Training & Placement Cell · Autonomous Standards.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES SECTION ────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-navy-900 px-3.5 py-1 rounded-full shadow-xs border-r-4 border-amber-500">
              Platform Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2.5">
              Comprehensive Skill Intelligence for SSMIET
            </h2>
            <p className="text-slate-600 mt-1.5 text-sm sm:text-base">
              Connecting Anna University curriculum standards with industry employment requirements across every department.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-navy-700/80 hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-navy-900 group-hover:text-white transition-all duration-200">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-navy-900 transition-colors">Skill Tracking & Growth</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Log programming, tools, core domain, and communication competencies across 4 proficiency tiers.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-amber-400/80 hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-amber-800 transition-colors">Department Requirements</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Faculty-defined target matrices tailored to academic year and specific branch specializations.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-navy-700/80 hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-navy-900 group-hover:text-white transition-all duration-200">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-navy-900 transition-colors">Roadmaps & Goals</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Milestone tracking with target deadlines, overdue alerts, and step-by-step progress metrics.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-amber-400/80 hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-amber-800 transition-colors">Projects & Achievements</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Document engineering projects with tech stacks, repository links, hackathons, and symposium honors.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-navy-700/80 hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-navy-900 group-hover:text-white transition-all duration-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-navy-900 transition-colors">Certificate Review Center</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Secure PDF/Image upload pipeline reviewed by authorized administrators with audit history.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-amber-400/80 hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-amber-800 transition-colors">Placement Readiness</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Track Coding, Aptitude, Technical, and Mock Interview evaluations to compute readiness scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPARTMENT EXPLORER ──────────────────────────────────────────────── */}
      <section id="departments" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200/90 px-3.5 py-1 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                Academic Disciplines
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2.5">
                SSMIET Engineering Programmes
              </h2>
              <p className="text-slate-600 mt-1.5 text-sm sm:text-base max-w-xl leading-relaxed">
                Explore accredited undergraduate engineering departments at SSMIET and their targeted core competencies.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search branch or skill..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 pl-10 pr-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900 focus:shadow-xs w-full transition-all duration-200"
                />
              </div>

              <div className="h-10 inline-flex items-center bg-slate-100/90 p-1 rounded-lg text-xs font-semibold shrink-0 border border-slate-200/70">
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  className={`h-8 px-3.5 rounded-md transition-all duration-150 whitespace-nowrap flex items-center font-bold active:scale-95 ${
                    selectedCategory === "ALL"
                      ? "bg-navy-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-navy-900 hover:bg-white/60 font-medium"
                  }`}
                >
                  All (10)
                </button>
                <button
                  onClick={() => setSelectedCategory("soc")}
                  className={`h-8 px-3.5 rounded-md transition-all duration-150 whitespace-nowrap flex items-center font-bold active:scale-95 ${
                    selectedCategory === "soc"
                      ? "bg-navy-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-navy-900 hover:bg-white/60 font-medium"
                  }`}
                >
                  Computing (SOC)
                </button>
                <button
                  onClick={() => setSelectedCategory("non_soc")}
                  className={`h-8 px-3.5 rounded-md transition-all duration-150 whitespace-nowrap flex items-center font-bold active:scale-95 ${
                    selectedCategory === "non_soc"
                      ? "bg-navy-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-navy-900 hover:bg-white/60 font-medium"
                  }`}
                >
                  Non-SOC Disciplines
                </button>
              </div>
            </div>
          </div>

          {filteredDepts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 p-8">
              <p className="text-slate-500 text-sm">No departments match your query "{search}".</p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("ALL");
                }}
                className="mt-3 text-xs font-semibold text-navy-900 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepts.map((dept) => (
                <DepartmentCard key={dept.code} dept={dept} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CERTIFICATE VERIFICATION LOOKUP ──────────────────────────────────── */}
      <section id="verification" className="py-16 sm:py-20 bg-navy-50/40 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-navy-900 px-3.5 py-1 rounded-full shadow-xs border-r-4 border-amber-500">
              Institutional Trust & Verification
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              Official Certificate Verification
            </h2>
            <p className="text-slate-600 mt-1.5 text-sm max-w-xl mx-auto">
              Verify the authenticity of certificates awarded to SSMIET students without exposing private student records or confidential documents.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleVerifySubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Enter Certificate UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
                  value={certInputId}
                  onChange={(e) => setCertInputId(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 font-mono text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying}
                className="h-11 bg-navy-900 hover:bg-navy-950 text-white px-6 rounded-lg font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap border-b-2 border-amber-500"
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 text-amber-400" />}
                <span>Verify Credential</span>
              </button>
            </form>

            {/* Results Display */}
            {hasVerified && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                {verificationData && (
                  <div className="bg-white rounded-xl border border-emerald-300 p-5 sm:p-6 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-950 text-sm sm:text-base">
                          Verified Institutional Record
                        </span>
                      </div>
                      <span className="text-xs font-mono bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200 font-bold shadow-2xs">
                        STATUS: VERIFIED
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-xs sm:text-sm pt-1">
                      <div>
                        <span className="text-slate-500 block font-medium text-xs">Certificate Title</span>
                        <span className="text-slate-900 font-bold text-sm sm:text-base">{verificationData.title}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-medium text-xs">Issuing Organization</span>
                        <span className="text-slate-900 font-semibold">{verificationData.issuer}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-medium text-xs">Student</span>
                        <span className="text-slate-900 font-semibold">{verificationData.student_name}</span>
                        {verificationData.department && (
                          <span className="text-slate-500 block text-xs mt-0.5">{verificationData.department}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500 block font-medium text-xs">Issue Date</span>
                        <span className="text-slate-900 font-semibold">{verificationData.issue_date}</span>
                        {verificationData.verified_at && (
                          <span className="text-slate-500 block text-xs mt-0.5">
                            Audited on {new Date(verificationData.verified_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {verificationData.credential_url && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">External Issuer Link:</span>
                        <a
                          href={verificationData.credential_url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-navy-900 font-semibold inline-flex items-center gap-1 hover:underline"
                        >
                          <span>External Credential URL</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {verificationError && (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-start gap-3 text-amber-950">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold">Certificate Record Not Found or Unverified</p>
                      <p className="mt-1 text-amber-900 leading-relaxed">
                        No public verified certificate matches this ID. Certificates must be verified by an authorized SSMIET administrator and published by the student to be displayed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── PORTAL ACCESS & SIGN IN ───────────────────────────────────────────── */}
      <section id="portals" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-navy-900 px-3.5 py-1 rounded-full shadow-xs border-r-4 border-amber-500">
              Institutional Access
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              Sign In to SSMIET Portals
            </h2>
            <p className="text-slate-600 mt-1.5 text-sm sm:text-base leading-relaxed">
              Direct access for SSMIET students, faculty review mentors, and placement coordinators.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Student Card */}
            <div className="bg-white rounded-xl border border-slate-200 hover:border-navy-700/80 p-6 shadow-xs hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center font-bold mb-4 group-hover:scale-110 group-hover:bg-navy-900 group-hover:text-white transition-all duration-200">
                  <UserCheck className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-navy-50 text-navy-900 border border-navy-200/90 shadow-2xs group-hover:bg-navy-900 group-hover:text-white group-hover:border-navy-900 transition-colors duration-200">
                  Student Portal
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-3.5 group-hover:text-navy-900 transition-colors">Student Dashboard</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed min-h-[4.25rem]">
                  Log programming skills, upload certificates for departmental review, track learning roadmaps, and monitor placement readiness.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 bg-navy-900 hover:bg-navy-950 text-white font-semibold rounded-lg text-sm shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 border-b-2 border-amber-500"
                >
                  Sign In as Student
                </Link>
                <Link
                  to="/register"
                  className="text-center text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline py-0.5 transition-colors"
                >
                  New Student? Register here
                </Link>
              </div>
            </div>

            {/* Faculty Card */}
            <div className="bg-white rounded-xl border border-slate-200 hover:border-amber-400/80 p-6 shadow-xs hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                  <Award className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-colors duration-200">
                  Faculty Review
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-3.5 group-hover:text-amber-800 transition-colors">Faculty & Advisor Workspace</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed min-h-[4.25rem]">
                  Review student certificate uploads, inspect authentic document evidence, submit approval decisions, and provide constructive feedback.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to="/login"
                  className="block w-full text-center py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                >
                  Sign In as Faculty
                </Link>
              </div>
            </div>

            {/* Admin & Placement Card */}
            <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-500/80 p-6 shadow-xs hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold mb-4 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all duration-200">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-colors duration-200">
                  Administration
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-3.5 group-hover:text-slate-900 transition-colors">Placement & Admin Console</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed min-h-[4.25rem]">
                  Manage college departments, configure curriculum matrices, export placement summaries, and monitor institution-wide skill progress.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to="/login"
                  className="block w-full text-center py-2.5 bg-slate-900 hover:bg-black text-white font-semibold rounded-lg text-sm shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                >
                  Sign In as Administrator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT SSMIET SECTION ────────────────────────────────────────────── */}
      <section id="about" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-white bg-navy-900 px-3.5 py-1 rounded-full shadow-xs border-r-4 border-amber-500">
                Institutional Profile
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                SSM Institute of Engineering and Technology
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                SSM Institute of Engineering and Technology (SSMIET), an Autonomous Institution established in Dindigul, Tamil Nadu,
                is dedicated to providing high-quality engineering education across computing, circuit, and core disciplines.
              </p>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Approved by AICTE, New Delhi • Affiliated to Anna University, Chennai • Accredited by NAAC & NBA.
                The SkillTrack platform operates as the institution's skill intelligence infrastructure, providing transparent
                verification workflows for career preparation and placement enablement.
              </p>
              <div className="pt-1">
                <a
                  href="https://ssmiet.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-navy-900 hover:text-amber-600 text-sm font-semibold underline underline-offset-4 transition-colors"
                >
                  <span>Visit Official SSMIET Institutional Website (ssmiet.ac.in)</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 p-5 sm:p-6 rounded-xl space-y-3 shadow-xs">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Campus Reference
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block font-medium">Institution</span>
                  <span className="font-semibold text-slate-900">SSM Institute of Engineering and Technology</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status</span>
                  <span className="font-semibold text-navy-900">An Autonomous Institution</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Campus Location</span>
                  <span>Palani Highway, Dindigul - 624 002, Tamil Nadu, India</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Accreditation & Affiliation</span>
                  <span>Approved by AICTE, New Delhi • Affiliated to Anna University, Chennai • Accredited by NAAC & NBA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-navy-900 text-slate-300 border-t-4 border-amber-500 text-xs py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-2">
              <div className="w-6 h-6 rounded bg-red-600 text-white font-black text-xs flex items-center justify-center">
                SSM
              </div>
              <span><span className="text-red-500 font-extrabold">SSM</span> SkillTrack</span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <p className="text-slate-400 leading-relaxed">
              Student Skill Intelligence, Certificate Verification & Placement Readiness Platform for SSM Institute of Engineering and Technology.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2.5">Navigation</h4>
            <ul className="space-y-1.5">
              <li>
                <a href="#departments" className="hover:text-amber-400 transition-colors">
                  Engineering Departments
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-amber-400 transition-colors">
                  Platform Features
                </a>
              </li>
              <li>
                <a href="#verification" className="hover:text-amber-400 transition-colors">
                  Public Certificate Verification
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-amber-400 transition-colors">
                  About SSMIET
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2.5">Portals</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/login" className="hover:text-amber-400 transition-colors">
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-amber-400 transition-colors">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-400 transition-colors">
                  Faculty & Coordinator Access
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-400 transition-colors">
                  Administrative Console
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2.5">Official Reference</h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://ssmiet.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 inline-flex items-center gap-1"
                >
                  <span>ssmiet.ac.in</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li className="text-slate-400">Palani Highway, Dindigul - 624 002</li>
              <li className="text-slate-400 pt-0.5">Autonomous · Anna University Affiliated</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <div>
            © {new Date().getFullYear()} SSM Institute of Engineering and Technology (An Autonomous Institution). All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="https://ssmiet.ac.in/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300">
              Official Institutional Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
