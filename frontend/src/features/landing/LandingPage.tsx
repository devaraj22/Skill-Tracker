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
  UserPlus,
  X,
  AlertCircle,
  Loader2,
  Building2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { SSMIET_DEPARTMENTS, type DepartmentInfo } from "./departmentsData";
import { DepartmentCard } from "./DepartmentCard";
import { SSMLogo } from "@/components/SSMLogo";
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
    <div className="min-h-screen bg-[#FCFBF7] text-[#1E293B] font-sans selection:bg-[#0B2A63] selection:text-white">
      {/* ── 1. OFFICIAL INSTITUTIONAL BANNER (EXACT REPLICA OF POSTER) ────────── */}
      <SSMLogo variant="banner" />

      {/* ── 2. STICKY TOP NAV BAR ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#0B2A63]/15 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          {/* Brand Logo in Navbar */}
          <Link to="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
            <SSMLogo variant="navbar" />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-[#0B2A63]">
            <a
              href="#courses"
              className="px-3 py-1.5 rounded-md hover:text-[#D32F2F] hover:bg-[#F0F4FA] transition-colors whitespace-nowrap"
            >
              Academic Programmes
            </a>
            <a
              href="#departments"
              className="px-3 py-1.5 rounded-md hover:text-[#D32F2F] hover:bg-[#F0F4FA] transition-colors whitespace-nowrap"
            >
              Departments
            </a>
            <a
              href="#features"
              className="px-3 py-1.5 rounded-md hover:text-[#D32F2F] hover:bg-[#F0F4FA] transition-colors whitespace-nowrap"
            >
              Skill Intelligence
            </a>
            <a
              href="#verification"
              className="px-3 py-1.5 rounded-md hover:text-[#D32F2F] hover:bg-[#F0F4FA] transition-colors whitespace-nowrap"
            >
              Verify Certificate
            </a>
            <a
              href="#about"
              className="px-3 py-1.5 rounded-md hover:text-[#D32F2F] hover:bg-[#F0F4FA] transition-colors whitespace-nowrap"
            >
              About Campus
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {user ? (
              <Link
                to={portalRoute}
                className="inline-flex items-center gap-2 bg-[#0B2A63] hover:bg-[#061838] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all whitespace-nowrap border-b-2 border-[#F59E0B]"
              >
                <LayoutDashboard className="h-4 w-4 text-[#FBBF24]" />
                <span>{portalLabel}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-[#0B2A63] hover:text-[#D32F2F] hover:bg-[#F0F4FA] rounded-lg transition-all border border-[#0B2A63]/30 whitespace-nowrap"
                >
                  <LogIn className="h-4 w-4 text-[#0B2A63]" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-xs hover:shadow transition-all whitespace-nowrap border-b-2 border-[#991B1B]"
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
            className="lg:hidden p-2 rounded-lg text-[#0B2A63] hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#0B2A63]/15 bg-white px-4 py-4 space-y-2 shadow-md">
            <a
              href="#courses"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[#0B2A63] hover:text-[#D32F2F] font-semibold py-1.5"
            >
              Academic Programmes
            </a>
            <a
              href="#departments"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[#0B2A63] hover:text-[#D32F2F] font-semibold py-1.5"
            >
              Departments
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[#0B2A63] hover:text-[#D32F2F] font-semibold py-1.5"
            >
              Skill Intelligence
            </a>
            <a
              href="#verification"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[#0B2A63] hover:text-[#D32F2F] font-semibold py-1.5"
            >
              Certificate Verification
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[#0B2A63] hover:text-[#D32F2F] font-semibold py-1.5"
            >
              About SSMIET
            </a>
            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              {user ? (
                <Link
                  to={portalRoute}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-[#0B2A63] text-white font-semibold rounded-lg text-sm"
                >
                  {portalLabel}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 border border-[#0B2A63]/30 text-[#0B2A63] font-semibold rounded-lg text-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 bg-[#D32F2F] text-white font-semibold rounded-lg text-sm"
                  >
                    Student Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── 3. HERO SECTION (FEATURING POSTER COURSES & CAMPUS ARCHITECTURE) ─── */}
      <section id="courses" className="py-12 sm:py-16 border-b border-[#0B2A63]/15 bg-gradient-to-b from-[#FCFBF7] via-white to-[#F0F4FA]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Content: Poster Course Matrix */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B2A63] text-white text-xs font-bold shadow-xs border-r-4 border-[#F59E0B]">
                <GraduationCap className="h-4 w-4 text-[#FBBF24]" />
                <span>SSM INSTITUTE OF ENGINEERING AND TECHNOLOGY · (An Autonomous Institution)</span>
              </div>

              {/* Headline */}
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-[#0B2A63] leading-[1.18]">
                  Student Skill and Certification Management System
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                  The official skill management and competency evaluation platform for SSMIET. Track curriculum outcomes, verify real certificates under faculty review, and map student proficiency to premier industry placements.
                </p>
              </div>

              {/* Exact Poster Courses Grid */}
              <div className="bg-white border border-[#0B2A63]/20 rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
                {/* Poster Gold Ribbon Corner */}
                <div className="absolute top-0 right-0 w-24 h-2 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]" />

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* UG COURSES COLUMN */}
                  <div className="space-y-3">
                    <div className="inline-block bg-[#0B2A63] text-white px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-xs">
                      UG COURSES
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-800 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="text-[#F59E0B] font-bold text-sm leading-none shrink-0 mt-0.5">❖</span>
                        <span><strong>B.E.</strong> - Civil Engineering</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#F59E0B] font-bold text-sm leading-none shrink-0 mt-0.5">❖</span>
                        <span><strong>B.E.</strong> - Mechanical Engineering</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#F59E0B] font-bold text-sm leading-none shrink-0 mt-0.5">❖</span>
                        <span><strong>B.E.</strong> - Electrical and Electronics Engineering</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#F59E0B] font-bold text-sm leading-none shrink-0 mt-0.5">❖</span>
                        <span><strong>B.E.</strong> - Electronics and Communication Engineering</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#F59E0B] font-bold text-sm leading-none shrink-0 mt-0.5">❖</span>
                        <span><strong>B.E.</strong> - Computer Science and Engineering</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#F59E0B] font-bold text-sm leading-none shrink-0 mt-0.5">❖</span>
                        <span><strong>B.E.</strong> - CSE (Cyber Security)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#F59E0B] font-bold text-sm leading-none shrink-0 mt-0.5">❖</span>
                        <span><strong>B.Tech.</strong> - Artificial Intelligence and Data Science</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#F59E0B] font-bold text-sm leading-none shrink-0 mt-0.5">❖</span>
                        <span><strong>B.Tech.</strong> - Computer Science and Business Systems</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#F59E0B] font-bold text-sm leading-none shrink-0 mt-0.5">❖</span>
                        <span><strong>B.Tech.</strong> - Information Technology</span>
                      </li>
                    </ul>
                  </div>

                  {/* PG & Ph.D. COURSES COLUMN */}
                  <div className="space-y-5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="inline-block bg-[#0B2A63] text-white px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-xs">
                        PG COURSES
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-800 font-medium">
                        <li className="flex items-start gap-2">
                          <span className="text-[#F59E0B] font-bold text-sm leading-none shrink-0 mt-0.5">❖</span>
                          <span><strong>M.E.</strong> - Communication Systems</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#F59E0B] font-bold text-sm leading-none shrink-0 mt-0.5">❖</span>
                          <span><strong>M.E.</strong> - Thermal Engineering</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="inline-block bg-[#0B2A63] text-white px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-xs">
                        Ph.D. PROGRAMMES
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Approved Research Centres for Doctoral Degrees under Anna University, Chennai.
                      </p>
                    </div>

                    {/* Palani Highway Location Tag */}
                    <div className="p-3 bg-[#FCFBF7] rounded-lg border border-[#0B2A63]/15 text-xs text-[#0B2A63]">
                      <span className="font-bold block">SSMIET Dindigul Campus</span>
                      <span className="text-slate-600">Palani Highway, Dindigul - 624 002</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to={user ? portalRoute : "/register"}
                  className="inline-flex items-center gap-2 bg-[#0B2A63] hover:bg-[#061838] text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap border-b-2 border-[#F59E0B] group"
                >
                  <span>{user ? `Go to ${portalLabel}` : "Explore Student Portal"}</span>
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>

                <a
                  href="#departments"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm text-[#0B2A63] hover:text-[#D32F2F] bg-white hover:bg-[#F0F4FA] border border-[#0B2A63]/30 transition-all duration-200 whitespace-nowrap group"
                >
                  <BookOpen className="h-4 w-4 text-[#0B2A63] group-hover:scale-110 transition-transform duration-200" />
                  <span>View All 10 Disciplines</span>
                </a>
              </div>
            </div>

            {/* Right Content: Modern SSMIET Campus Visual Frame */}
            <div className="lg:col-span-5">
              <div className="bg-white border-2 border-[#0B2A63]/20 rounded-2xl shadow-lift overflow-hidden">
                {/* Visual Header Banner */}
                <div className="bg-gradient-to-r from-[#061838] via-[#0B2A63] to-[#0D357A] p-4 text-white flex items-center justify-between border-b-2 border-[#F59E0B]">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-5 w-5 text-[#FBBF24]" />
                    <span className="font-black text-sm tracking-wide">SSMIET ACADEMIC CAMPUS</span>
                  </div>
                  <span
                    className="text-[#FBBF24] text-xs font-serif italic"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Infinite Possibilities
                  </span>
                </div>

                {/* Campus Facade Illustration / Representative Card */}
                <div className="p-6 bg-gradient-to-b from-[#FCFBF7] to-white space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 p-6 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#0B2A63] text-white flex items-center justify-center font-black text-2xl shadow-md mb-3 border-2 border-[#FBBF24]">
                      SSM
                    </div>
                    <h3 className="font-extrabold text-[#0B2A63] text-base">
                      SSM Institute of Engineering and Technology
                    </h3>
                    <p className="text-xs text-[#D32F2F] font-bold mt-0.5">
                      (An Autonomous Institution)
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Palani Highway, Dindigul - 624 002
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-200/80 text-[11px] font-semibold text-slate-700">
                      Approved by AICTE • Affiliated to Anna University • Accredited by NAAC &amp; NBA
                    </div>
                  </div>

                  {/* Student Placement Readiness Stats Card */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
                      <span className="font-bold text-[#0B2A63]">Skill Intelligence Highlights</span>
                      <span className="text-xs font-extrabold text-[#15803D] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Anna Univ. Matrix
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-lg bg-[#FCFBF7] border border-[#0B2A63]/15 text-left">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Engineering Branches</span>
                        <span className="text-lg font-black text-[#0B2A63]">10 Disciplines</span>
                        <span className="text-[11px] text-[#D32F2F] font-semibold block mt-0.5">SOC &amp; Non-SOC</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#FCFBF7] border border-[#0B2A63]/15 text-left">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Accreditation</span>
                        <span className="text-lg font-black text-[#0B2A63]">NAAC &amp; NBA</span>
                        <span className="text-[11px] text-[#F59E0B] font-semibold block mt-0.5">Autonomous Tier</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#F0F4FA] border border-[#0B2A63]/15 text-xs text-[#0B2A63] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#D32F2F] shrink-0" />
                      <span>Tamper-evident Certificate Verification &amp; Audit Logs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. PLATFORM FEATURES ─────────────────────────────────────────────── */}
      <section id="features" className="py-16 bg-white border-b border-[#0B2A63]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-white bg-[#0B2A63] px-3.5 py-1 rounded-full shadow-xs border-r-4 border-[#F59E0B]">
              Institutional Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B2A63] mt-2.5">
              Comprehensive Skill Intelligence for SSMIET
            </h2>
            <p className="text-slate-600 mt-1.5 text-sm sm:text-base">
              Connecting Anna University curriculum standards with industry employment requirements across every department.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-[#0B2A63]/15 bg-[#FCFBF7] hover:border-[#0B2A63] hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-[#0B2A63] text-white flex items-center justify-center mb-4 group-hover:bg-[#D32F2F] transition-colors duration-200">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#0B2A63]">Skill Tracking &amp; Growth</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Log programming, tools, core domain, and communication competencies across 4 proficiency tiers.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#0B2A63]/15 bg-[#FCFBF7] hover:border-[#0B2A63] hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-[#0B2A63] text-white flex items-center justify-center mb-4 group-hover:bg-[#F59E0B] transition-colors duration-200">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#0B2A63]">Department Requirements</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Faculty-defined target matrices tailored to academic year and specific branch specializations.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#0B2A63]/15 bg-[#FCFBF7] hover:border-[#0B2A63] hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-[#0B2A63] text-white flex items-center justify-center mb-4 group-hover:bg-[#D32F2F] transition-colors duration-200">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#0B2A63]">Roadmaps &amp; Goals</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Milestone tracking with target deadlines, overdue alerts, and step-by-step progress metrics.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#0B2A63]/15 bg-[#FCFBF7] hover:border-[#0B2A63] hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-[#0B2A63] text-white flex items-center justify-center mb-4 group-hover:bg-[#F59E0B] transition-colors duration-200">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#0B2A63]">Projects &amp; Achievements</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Document engineering projects with tech stacks, repository links, hackathons, and symposium honors.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#0B2A63]/15 bg-[#FCFBF7] hover:border-[#0B2A63] hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-[#0B2A63] text-white flex items-center justify-center mb-4 group-hover:bg-[#D32F2F] transition-colors duration-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#0B2A63]">Certificate Review Center</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Secure PDF/Image upload pipeline reviewed by authorized administrators with audit history.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#0B2A63]/15 bg-[#FCFBF7] hover:border-[#0B2A63] hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out group">
              <div className="w-10 h-10 rounded-lg bg-[#0B2A63] text-white flex items-center justify-center mb-4 group-hover:bg-[#F59E0B] transition-colors duration-200">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#0B2A63]">Placement Readiness</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Track Coding, Aptitude, Technical, and Mock Interview evaluations to compute readiness scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. DEPARTMENT EXPLORER ───────────────────────────────────────────── */}
      <section id="departments" className="py-16 sm:py-20 bg-[#FCFBF7] border-b border-[#0B2A63]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#0B2A63] bg-white border border-[#0B2A63]/20 px-3.5 py-1 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                Academic Disciplines
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B2A63] mt-2.5">
                SSMIET Engineering Departments
              </h2>
              <p className="text-slate-600 mt-1.5 text-sm sm:text-base max-w-xl leading-relaxed">
                Explore accredited undergraduate engineering departments at SSMIET and their targeted core competencies.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0B2A63]/50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search branch or skill..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 pl-10 pr-4 bg-white border border-[#0B2A63]/20 rounded-lg text-sm text-[#0B2A63] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2A63] focus:border-[#0B2A63] w-full transition-all duration-200"
                />
              </div>

              <div className="h-10 inline-flex items-center bg-white p-1 rounded-lg text-xs font-semibold shrink-0 border border-[#0B2A63]/20 shadow-xs">
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  className={`h-8 px-3.5 rounded-md transition-all duration-150 whitespace-nowrap flex items-center font-bold ${
                    selectedCategory === "ALL"
                      ? "bg-[#0B2A63] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0B2A63] hover:bg-[#F0F4FA]"
                  }`}
                >
                  All (10)
                </button>
                <button
                  onClick={() => setSelectedCategory("soc")}
                  className={`h-8 px-3.5 rounded-md transition-all duration-150 whitespace-nowrap flex items-center font-bold ${
                    selectedCategory === "soc"
                      ? "bg-[#0B2A63] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0B2A63] hover:bg-[#F0F4FA]"
                  }`}
                >
                  Computing (SOC)
                </button>
                <button
                  onClick={() => setSelectedCategory("non_soc")}
                  className={`h-8 px-3.5 rounded-md transition-all duration-150 whitespace-nowrap flex items-center font-bold ${
                    selectedCategory === "non_soc"
                      ? "bg-[#0B2A63] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0B2A63] hover:bg-[#F0F4FA]"
                  }`}
                >
                  Non-SOC Disciplines
                </button>
              </div>
            </div>
          </div>

          {filteredDepts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-[#0B2A63]/15 p-8">
              <p className="text-slate-500 text-sm">No departments match your query "{search}".</p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("ALL");
                }}
                className="mt-3 text-xs font-bold text-[#0B2A63] hover:underline"
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

      {/* ── 6. CERTIFICATE VERIFICATION LOOKUP ───────────────────────────────── */}
      <section id="verification" className="py-16 sm:py-20 bg-white border-b border-[#0B2A63]/15">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-black uppercase tracking-wider text-white bg-[#0B2A63] px-3.5 py-1 rounded-full shadow-xs border-r-4 border-[#F59E0B]">
              Institutional Trust &amp; Verification
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B2A63] mt-2">
              Official Certificate Verification
            </h2>
            <p className="text-slate-600 mt-1.5 text-sm max-w-xl mx-auto">
              Verify the authenticity of credentials awarded to SSMIET students without exposing private student records or confidential documents.
            </p>
          </div>

          <div className="bg-[#FCFBF7] border border-[#0B2A63]/20 rounded-2xl p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleVerifySubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#0B2A63]/50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Paste Certificate UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)..."
                  value={certInputId}
                  onChange={(e) => setCertInputId(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-white border border-[#0B2A63]/25 rounded-xl text-sm text-[#0B2A63] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2A63] font-mono shadow-xs"
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying || !certInputId.trim()}
                className="h-12 px-6 bg-[#0B2A63] hover:bg-[#061838] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap border-b-2 border-[#F59E0B]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#FBBF24]" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-[#FBBF24]" />
                    <span>Verify Authenticity</span>
                  </>
                )}
              </button>
            </form>

            {/* Results Display */}
            {hasVerified && (
              <div className="mt-6 pt-6 border-t border-[#0B2A63]/15">
                {verificationData ? (
                  <div className="bg-white border-2 border-emerald-500/50 rounded-xl p-5 shadow-xs animate-fadeInUp">
                    <div className="flex items-center gap-2 text-emerald-800 font-black text-sm mb-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <span>OFFICIAL VERIFICATION: CERTIFICATE IS AUTHENTIC &amp; REVIEWED</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Title</span>
                        <span className="font-bold text-[#0B2A63] text-sm">{verificationData.title}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Issuing Body</span>
                        <span className="font-semibold text-slate-800">{verificationData.issuer}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Student</span>
                        <span className="font-semibold text-slate-800">{verificationData.student_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Department</span>
                        <span className="font-semibold text-slate-800">{verificationData.department ?? "General"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Issue Date</span>
                        <span className="font-semibold text-slate-800">{verificationData.issue_date}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Verification Status</span>
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold uppercase">
                          Audited by SSMIET Authority
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-red-200 rounded-xl p-4 text-xs text-[#D32F2F] flex items-center gap-2.5">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>
                      Certificate record not found or not published for public verification. Please verify the ID with the student or college administration.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 7. ABOUT SSMIET ─────────────────────────────────────────────────── */}
      <section id="about" className="py-16 bg-[#FCFBF7] border-b border-[#0B2A63]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-white bg-[#0B2A63] px-3.5 py-1 rounded-full shadow-xs border-r-4 border-[#F59E0B]">
                Institutional Profile
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B2A63]">
                SSM Institute of Engineering and Technology
              </h2>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                SSM Institute of Engineering and Technology (SSMIET), an Autonomous Institution located on the Palani Highway in Dindigul, Tamil Nadu, is committed to producing world-class engineers equipped with cutting-edge industry competencies.
              </p>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Approved by AICTE, New Delhi • Affiliated to Anna University, Chennai • Accredited by NAAC &amp; NBA.
                SkillTrack functions as the college's authoritative skill intelligence and placement management platform, providing tamper-evident portfolio hosting and department curriculum benchmarking.
              </p>
              <div className="pt-2">
                <a
                  href="https://ssmiet.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#0B2A63] hover:text-[#D32F2F] text-sm font-bold underline underline-offset-4 transition-colors"
                >
                  <span>Visit Official Institutional Website (ssmiet.ac.in)</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border-2 border-[#0B2A63]/20 p-6 rounded-2xl space-y-3.5 shadow-sm">
              <h3 className="font-extrabold text-xs text-[#0B2A63] uppercase tracking-wider pb-2 border-b border-slate-100">
                Official Campus Reference
              </h3>
              <div className="space-y-3 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 block font-medium">Institution</span>
                  <span className="font-bold text-[#0B2A63] text-sm">SSM Institute of Engineering and Technology</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Institutional Status</span>
                  <span className="font-extrabold text-[#D32F2F]">An Autonomous Institution</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Campus Location</span>
                  <span>Palani Highway, Dindigul – 624 002, Tamil Nadu, India</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Accreditations &amp; Affiliations</span>
                  <span>Approved by AICTE, New Delhi • Affiliated to Anna University, Chennai • Accredited by NAAC &amp; NBA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. INSTITUTIONAL FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-gradient-to-b from-[#0B2A63] to-[#061838] text-slate-200 border-t-4 border-[#F59E0B] text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 text-white font-bold text-base mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D32F2F] text-white font-black text-xs flex items-center justify-center border border-white/40 shadow-xs">
                SSM
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight leading-none">
                  SSMIET SkillTrack
                </span>
                <span className="text-[10px] text-[#FBBF24] font-semibold mt-0.5">
                  Autonomous · Dindigul
                </span>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              Student Skill and Certification Management System for SSM Institute of Engineering and Technology.
            </p>
          </div>

          <div>
            <h4 className="text-[#FBBF24] font-bold uppercase tracking-wider mb-3">Academic Sections</h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a href="#courses" className="hover:text-white transition-colors">
                  UG &amp; PG Programmes
                </a>
              </li>
              <li>
                <a href="#departments" className="hover:text-white transition-colors">
                  10 Engineering Disciplines
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Skill Intelligence Matrix
                </a>
              </li>
              <li>
                <a href="#verification" className="hover:text-white transition-colors">
                  Certificate Verification
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#FBBF24] font-bold uppercase tracking-wider mb-3">Portals &amp; Access</h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Faculty &amp; Coordinator Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Administrative Console
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#FBBF24] font-bold uppercase tracking-wider mb-3">Campus Address</h4>
            <ul className="space-y-1.5 text-slate-300">
              <li className="font-semibold text-white">SSM Institute of Engineering and Technology</li>
              <li>Palani Highway, Dindigul – 624 002</li>
              <li>Tamil Nadu, India</li>
              <li className="pt-2">
                <a
                  href="https://ssmiet.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FBBF24] inline-flex items-center gap-1 font-semibold text-white underline"
                >
                  <span>ssmiet.ac.in</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <div>
            © {new Date().getFullYear()} SSM Institute of Engineering and Technology (An Autonomous Institution). All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="https://ssmiet.ac.in/" target="_blank" rel="noopener noreferrer" className="hover:text-[#FBBF24]">
              Official SSMIET Institutional Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
