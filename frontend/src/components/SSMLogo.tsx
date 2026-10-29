import type { SVGProps } from "react";

interface SSMLogoProps {
  variant?: "badge" | "navbar" | "header" | "banner" | "auth";
  className?: string;
  showAccreditations?: boolean;
}

/**
 * Official SSMBadgeSvg - Scalable vector graphic replica of the emblem from the poster.
 * - Crimson Red gradient rounded rectangle with white & gold double border
 * - Top: "INFINITE POSSIBILITIES"
 * - Center: White Infinity Symbol ∞
 * - Bold: "SSM"
 * - Bottom Pill: "• THE LEARNING HUB •"
 * Vector coordinates ensure it NEVER wraps, clips, or distorts at any scale.
 */
export function SSMBadgeSvg({ className = "w-14 h-16", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="SSM The Learning Hub Official Emblem"
      {...props}
    >
      <defs>
        <linearGradient id="ssmEmblemGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EA3A3A" />
          <stop offset="40%" stopColor="#D32F2F" />
          <stop offset="100%" stopColor="#A31515" />
        </linearGradient>
        <filter id="ssmEmblemShadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#7F0000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer Rounded Rectangle */}
      <rect
        x="2.5"
        y="2.5"
        width="95"
        height="110"
        rx="16"
        fill="url(#ssmEmblemGrad)"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        filter="url(#ssmEmblemShadow)"
      />

      {/* Subtle Gold Inner Outline */}
      <rect
        x="5.5"
        y="5.5"
        width="89"
        height="104"
        rx="13"
        fill="none"
        stroke="#FDE68A"
        strokeWidth="0.8"
        strokeOpacity="0.55"
      />

      {/* Top Text: INFINITE POSSIBILITIES */}
      <text
        x="50"
        y="17"
        textAnchor="middle"
        fill="#FFFBEB"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="6.3"
        fontWeight="800"
        letterSpacing="0.8"
      >
        INFINITE POSSIBILITIES
      </text>

      {/* White Infinity Symbol ∞ */}
      <path
        d="M35 34 C27 34 20 38 20 42.5 C20 47 27 51 35 51 C42 51 46.5 46.5 50 42.5 C53.5 46.5 58 51 65 51 C73 51 80 47 80 42.5 C80 38 73 34 65 34 C58 34 53.5 38.5 50 42.5 C46.5 38.5 42 34 35 34 Z M35 38 C40 38 44 41 46.5 42.5 C44 44 40 47 35 47 C29.5 47 24.5 45 24.5 42.5 C24.5 40 29.5 38 35 38 Z M65 38 C70.5 38 75.5 40 75.5 42.5 C75.5 45 70.5 47 65 47 C60 47 56 44 53.5 42.5 C56 41 60 38 65 38 Z"
        fill="#FFFFFF"
      />

      {/* SSM Bold Wordmark */}
      <text
        x="50"
        y="78"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="27"
        fontWeight="900"
        letterSpacing="-0.8"
      >
        SSM
      </text>

      {/* Bottom Capsule Pill: • THE LEARNING HUB • */}
      <rect
        x="6"
        y="87"
        width="88"
        height="18"
        rx="9"
        fill="#000000"
        fillOpacity="0.32"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        strokeOpacity="0.65"
      />
      <text
        x="50"
        y="99"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="6.3"
        fontWeight="800"
        letterSpacing="0.4"
      >
        • THE LEARNING HUB •
      </text>
    </svg>
  );
}

/**
 * Official SSMLogo Component
 * Supports:
 * - "badge": Standalone vector emblem
 * - "navbar": Compact horizontal logo for top bar and sidebar navigation
 * - "auth": Centered or balanced lockup tailored for login/registration cards
 * - "header": Medium horizontal lockup with institution title and subtitles
 * - "banner": Full-width official poster banner with the navy ribbon and gold stripes
 */
export function SSMLogo({ variant = "navbar", className = "", showAccreditations = true }: SSMLogoProps) {
  // 1. Standalone Emblem Badge
  if (variant === "badge") {
    return <SSMBadgeSvg className={className || "w-14 h-16"} />;
  }

  // 2. Compact Navbar / Sidebar Item
  if (variant === "navbar") {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <SSMBadgeSvg className="w-9 h-10.5" />
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 leading-tight">
            <span className="text-[#D32F2F] font-black text-base tracking-tight">SSM</span>
            <span className="text-[#0B2A63] font-black text-sm tracking-tight">SkillTrack</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F59E0B] ml-0.5" />
          </div>
          <span className="text-[10px] font-bold text-[#0B2A63]/80 leading-tight">
            Autonomous · Dindigul
          </span>
        </div>
      </div>
    );
  }

  // 3. Auth Page Lockup (Clean, balanced, never wraps or splits text awkwardly)
  if (variant === "auth") {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <SSMBadgeSvg className="w-16 h-18 mb-3" />
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl font-black text-[#D32F2F] tracking-tight leading-none">
            SSM
          </span>
          <div className="flex flex-col text-left text-[#991B1B] font-extrabold text-xs tracking-wider uppercase leading-tight">
            <span>INSTITUTE OF</span>
            <span>ENGINEERING AND TECHNOLOGY</span>
          </div>
        </div>
        <div className="mt-2 text-xs font-bold text-[#0B2A63] tracking-tight">
          (An Autonomous Institution)
        </div>
        <div className="text-[11px] font-semibold text-[#0B2A63]/80 uppercase tracking-wide mt-0.5">
          Palani Highway, Dindigul – 624002
        </div>
      </div>
    );
  }

  // 4. Medium Horizontal Header (Dialogs, Page Headers)
  if (variant === "header") {
    return (
      <div className={`flex items-center gap-3.5 sm:gap-4 ${className}`}>
        <SSMBadgeSvg className="w-14 h-16.5 shrink-0" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Official Institution Brand Lockup */}
        <div className="flex items-center gap-3.5 sm:gap-4 z-10">
          <SSMBadgeSvg className="w-14 h-16.5 sm:w-16 sm:h-18.5 shrink-0" />

          <div className="flex flex-col">
            {/* Title: SSM in bold red + INSTITUTE OF ENGINEERING AND TECHNOLOGY */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <span className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#D32F2F] tracking-tight leading-none">
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

        {/* Right Side: Exact Poster Navy Ribbon with Dual Gold Stripes */}
        <div className="relative self-end md:self-stretch flex items-center">
          <div className="hidden lg:flex items-center bg-gradient-to-r from-[#061838] via-[#0B2A63] to-[#0D3B75] text-white px-6 py-2.5 rounded-l-2xl shadow-md border-y-2 border-l-2 border-[#F59E0B] relative overflow-hidden group">
            {/* Double Gold Accent Stripes from Poster */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B]" />
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F59E0B]" />

            <div className="flex flex-col items-end pr-2">
              <span
                className="text-white text-base font-serif italic tracking-wide"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Infinite
              </span>
              <span className="text-[#FBBF24] font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow-xs">
                POSSIBILITIES BEGIN HERE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
