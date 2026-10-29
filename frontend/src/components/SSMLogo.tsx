
interface SSMLogoProps {
  variant?: "badge" | "navbar" | "header" | "banner";
  className?: string;
  showAccreditations?: boolean;
}

/**
 * Official SSMIET Institutional Logo & Poster Banner
 * Strictly faithful to the official SSM Institute of Engineering and Technology poster.
 * Colors:
 * - SSM Red: #D32F2F / #B71C1C
 * - Royal Navy: #0B2A63 / #061838
 * - Golden Amber: #F59E0B / #FBBF24
 * - Deep Crimson: #991B1B
 * - Warm Ivory: #FCFBF7
 */
export function SSMLogo({ variant = "navbar", className = "", showAccreditations = true }: SSMLogoProps) {
  // ── Standalone Emblem Badge ────────────────────────────────────────────────
  const BadgeEmblem = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "w-8 h-8 rounded-md p-0.5",
      md: "w-11 h-11 rounded-lg p-1",
      lg: "w-14 h-14 rounded-xl p-1.5",
    }[size];

    const infinitySize = size === "sm" ? 14 : size === "md" ? 18 : 22;
    const ssmTextSize = size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm";
    const subTextSize = size === "sm" ? "text-[4.5px]" : size === "md" ? "text-[6px]" : "text-[7.5px]";

    return (
      <div
        className={`relative shrink-0 flex flex-col items-center justify-between bg-gradient-to-br from-[#E53935] via-[#D32F2F] to-[#B71C1C] border border-white/50 shadow-sm text-white select-none ${sizeClasses}`}
        style={{
          boxShadow: "0 2px 6px -1px rgba(183, 28, 28, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
        }}
        aria-label="SSM The Learning Hub Logo Badge"
      >
        {/* Top Arc Text */}
        <span
          className={`font-black tracking-widest text-[#FDE68A] uppercase leading-none text-center ${subTextSize}`}
          style={{ letterSpacing: "0.08em" }}
        >
          INFINITE POSSIBILITIES
        </span>

        {/* Center Infinity Symbol & SSM */}
        <div className="flex flex-col items-center justify-center my-auto -space-y-0.5">
          <svg
            width={infinitySize}
            height={infinitySize * 0.55}
            viewBox="0 0 40 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white drop-shadow-xs"
          >
            <path
              d="M12.5 4C7.8 4 4 7.6 4 11C4 14.4 7.8 18 12.5 18C16.8 18 19.3 14.8 20 13.5C20.7 14.8 23.2 18 27.5 18C32.2 18 36 14.4 36 11C36 7.6 32.2 4 27.5 4C23.2 4 20.7 7.2 20 8.5C19.3 7.2 16.8 4 12.5 4ZM12.5 7.5C14.7 7.5 16.6 9.4 17.5 11C16.6 12.6 14.7 14.5 12.5 14.5C9.7 14.5 7.5 12.9 7.5 11C7.5 9.1 9.7 7.5 12.5 7.5ZM27.5 7.5C30.3 7.5 32.5 9.1 32.5 11C32.5 12.9 30.3 14.5 27.5 14.5C25.3 14.5 23.4 12.6 22.5 11C23.4 9.4 25.3 7.5 27.5 7.5Z"
              fill="white"
            />
          </svg>
          <span className={`font-black tracking-tight leading-none text-white ${ssmTextSize}`}>
            SSM
          </span>
        </div>

        {/* Bottom Hub Pill */}
        <div className="w-full bg-black/25 rounded-xs py-0.2 flex items-center justify-center">
          <span
            className={`font-semibold tracking-wider text-white uppercase leading-none ${subTextSize}`}
          >
            • THE LEARNING HUB •
          </span>
        </div>
      </div>
    );
  };

  // 1. Just Badge
  if (variant === "badge") {
    return <BadgeEmblem size="md" />;
  }

  // 2. Compact Navbar / Sidebar Item
  if (variant === "navbar") {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <BadgeEmblem size="sm" />
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 leading-tight">
            <span className="text-[#D32F2F] font-black text-base tracking-tight">SSM</span>
            <span className="text-[#0B2A63] font-bold text-sm tracking-tight">SkillTrack</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F59E0B] ml-0.5" />
          </div>
          <span className="text-[10px] font-semibold text-[#0B2A63]/80 leading-tight">
            Autonomous · Dindigul
          </span>
        </div>
      </div>
    );
  }

  // 3. Medium Institutional Header (e.g., Auth Pages, Dialogs)
  if (variant === "header") {
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        <BadgeEmblem size="lg" />
        <div className="flex flex-col text-left">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#D32F2F] tracking-tight leading-none">
              SSM
            </span>
            <div className="flex flex-col font-extrabold text-[#991B1B] text-xs sm:text-sm tracking-wider uppercase leading-tight">
              <span>INSTITUTE OF</span>
              <span>ENGINEERING AND TECHNOLOGY</span>
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-[#0B2A63] mt-1 tracking-tight">
            (An Autonomous Institution) · PALANI HIGHWAY, DINDIGUL – 624002
          </div>
          {showAccreditations && (
            <div className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5">
              Approved by AICTE, New Delhi • Affiliated to Anna University, Chennai • Accredited by NAAC &amp; NBA
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. Full Poster Banner (Exact replica of the provided poster header)
  return (
    <div
      className={`relative w-full overflow-hidden bg-[#FCFBF7] border-b border-[#0B2A63]/15 shadow-xs select-none ${className}`}
      style={{
        backgroundImage: "radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.04) 0%, transparent 40%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Exact Poster Institution Header */}
        <div className="flex items-center gap-3.5 sm:gap-4.5 z-10">
          <BadgeEmblem size="lg" />

          <div className="flex flex-col">
            {/* Title Line: SSM in large bold red + INSTITUTE OF ENGINEERING AND TECHNOLOGY */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <span className="text-3xl sm:text-4xl lg:text-[40px] font-black text-[#D32F2F] tracking-tight leading-none">
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
