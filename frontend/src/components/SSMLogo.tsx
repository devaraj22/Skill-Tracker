import type { ImgHTMLAttributes } from "react";
import ssmLogoImg from "@/assets/ssm-logo.png";

interface SSMLogoProps {
  variant?: "badge" | "navbar" | "header" | "banner" | "auth";
  className?: string;
  showAccreditations?: boolean;
}

/**
 * Official SSMBadgeSvg - Scalable official emblem component.
 * Displays the authentic SSM Institute of Engineering and Technology emblem logo.
 */
export function SSMBadgeSvg({
  className = "w-12 h-auto",
  alt = "SSM The Learning Hub Official Emblem",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={ssmLogoImg}
      alt={alt}
      className={`shrink-0 select-none object-contain rounded-xs ${className}`}
      loading="eager"
      {...props}
    />
  );
}

/**
 * Official SSMLogo Component
 * Supports:
 * - "badge": Standalone emblem
 * - "navbar": Compact horizontal logo for top bar and sidebar navigation
 * - "auth": Balanced horizontal lockup tailored for login/registration cards
 * - "header": Medium horizontal lockup with institution title and subtitles
 * - "banner": Full-width official poster banner with institution branding
 */
export function SSMLogo({ variant = "navbar", className = "", showAccreditations = true }: SSMLogoProps) {
  // 1. Standalone Emblem Badge
  if (variant === "badge") {
    return <SSMBadgeSvg className={className || "w-14 h-auto"} />;
  }

  // 2. Compact Navbar / Sidebar Item
  if (variant === "navbar") {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <SSMBadgeSvg className="w-8.5 h-auto max-h-8.5" />
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 leading-tight">
            <span className="text-[#D32F2F] font-black text-base tracking-tight">SSM</span>
            <span className="text-[#0B2A63] font-black text-sm tracking-tight">SkillTrack</span>
          </div>
          <span className="text-[10px] font-bold text-[#0B2A63]/80 leading-tight">
            Autonomous · Dindigul
          </span>
        </div>
      </div>
    );
  }

  // 3. Auth Page Lockup (Official horizontal lockup: emblem on left, name on right)
  if (variant === "auth") {
    return (
      <div className={`flex items-center justify-center gap-3 sm:gap-3.5 select-none ${className}`}>
        <SSMBadgeSvg className="w-11 h-auto sm:w-13 max-h-13 shrink-0 drop-shadow-xs" />
        <div className="flex items-center gap-2 text-left">
          <span className="text-2xl sm:text-3xl font-black text-[#D32F2F] tracking-tight leading-none">
            SSM
          </span>
          <div className="flex flex-col text-[#991B1B] font-extrabold text-[10px] sm:text-[11px] tracking-wider uppercase leading-tight">
            <span>INSTITUTE OF</span>
            <span>ENGINEERING AND TECHNOLOGY</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Medium Horizontal Header (Dialogs, Page Headers)
  if (variant === "header") {
    return (
      <div className={`flex items-center gap-3.5 sm:gap-4 ${className}`}>
        <SSMBadgeSvg className="w-13 h-auto sm:w-15 max-h-15 shrink-0" />
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-black text-[#D32F2F] tracking-tight leading-none">
              SSM
            </span>
            <div className="flex flex-col text-[#991B1B] font-extrabold text-xs sm:text-sm tracking-wide uppercase leading-tight">
              <span>INSTITUTE OF</span>
              <span>ENGINEERING AND TECHNOLOGY</span>
            </div>
          </div>
          <div className="text-xs font-bold text-[#0B2A63] mt-1 tracking-tight">
            <span>(An Autonomous Institution)</span>
            <span className="mx-1.5 text-[#0B2A63]/40">•</span>
            <span>Palani Highway, Dindigul – 624002</span>
          </div>
          {showAccreditations && (
            <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium mt-0.5">
              Approved by AICTE, New Delhi • Affiliated to Anna University, Chennai • Accredited by NAAC &amp; NBA
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5. Full Poster Banner (Top of Landing Page)
  return (
    <div
      className={`relative w-full overflow-hidden bg-[#FCFBF7] border-b border-[#0B2A63]/15 shadow-xs select-none ${className}`}
      style={{
        backgroundImage: "radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.04) 0%, transparent 40%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-4">
        {/* Official Institution Brand Lockup */}
        <div className="flex items-center gap-3.5 sm:gap-4 z-10">
          <SSMBadgeSvg className="w-13 sm:w-15 h-auto max-h-15 shrink-0" />

          <div className="flex flex-col">
            {/* Title: SSM in bold red + INSTITUTE OF ENGINEERING AND TECHNOLOGY */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#D32F2F] tracking-tight leading-none">
                SSM
              </span>
              <div className="flex flex-col text-[#991B1B] font-extrabold text-xs sm:text-sm lg:text-base tracking-wide uppercase leading-tight">
                <span>INSTITUTE OF</span>
                <span>ENGINEERING AND TECHNOLOGY</span>
              </div>
            </div>

            {/* Autonomous & Palani Highway Subtitle in Royal Navy */}
            <div className="mt-1 text-xs sm:text-sm font-bold text-[#0B2A63] tracking-tight flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold">(An Autonomous Institution)</span>
              <span className="hidden sm:inline text-[#0B2A63]/50">|</span>
              <span className="font-bold uppercase tracking-wider text-[11px] sm:text-xs">
                PALANI HIGHWAY, DINDIGUL – 624002
              </span>
            </div>

            {/* Accreditation details */}
            {showAccreditations && (
              <div className="text-[10px] sm:text-[11px] text-slate-700 font-medium mt-0.5 tracking-tight">
                Approved by AICTE, New Delhi • Affiliated to Anna University, Chennai • Accredited by NAAC &amp; NBA
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Institutional Collegiate Credential Badges */}
        <div className="hidden md:flex items-center gap-3.5 shrink-0 z-10">
          <div className="flex flex-col items-end text-right">
            <span className="text-[11px] font-black text-[#0B2A63] tracking-wider uppercase">
              Autonomous Institution
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              Anna University Curriculum
            </span>
          </div>
          <div className="h-8 w-px bg-[#0B2A63]/15" />
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-black uppercase text-[#D32F2F] tracking-wider">
              Accredited
            </span>
            <span className="text-xs font-bold text-[#0B2A63]">
              NAAC &amp; NBA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
