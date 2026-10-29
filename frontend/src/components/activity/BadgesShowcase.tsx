import {
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  FolderGit2,
  Globe,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { ProgressBar } from "@/components/ui";
import type { BadgeItem, BadgesSummary } from "@/types";
import "./BadgesShowcase.css";

interface BadgesShowcaseProps {
  data: BadgesSummary;
  title?: string;
}

function renderBadgeIcon(iconName: string): ReactNode {
  const iClass = "h-5 w-5";
  switch (iconName) {
    case "Sparkles": return <Sparkles className={iClass} />;
    case "BookOpen": return <BookOpen className={iClass} />;
    case "Award": return <Award className={iClass} />;
    case "FolderGit2": return <FolderGit2 className={iClass} />;
    case "ShieldCheck": return <ShieldCheck className={iClass} />;
    case "Target": return <Target className={iClass} />;
    case "Flame": return <Flame className={iClass} />;
    case "Zap": return <Zap className={iClass} />;
    case "Trophy": return <Trophy className={iClass} />;
    case "Globe": return <Globe className={iClass} />;
    default: return <Award className={iClass} />;
  }
}

export function BadgesShowcase({ data, title = "Skill & Milestone Badges" }: BadgesShowcaseProps) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  if (!data?.badges || !Array.isArray(data.badges)) {
    return null;
  }

  const filteredBadges = data.badges.filter((b) => {
    if (filter === "unlocked") return b.unlocked;
    if (filter === "locked") return !b.unlocked;
    return true;
  });

  return (
    <div className="badges-container">
      <div className="badges-header">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">
            {data.unlocked_count} of {data.total_count} unlocked ({data.completion_percentage}%)
          </p>
        </div>

        <div className="badges-filter-group" role="tablist" aria-label="Badge filters">
          <button
            type="button"
            className={`badges-filter-btn${filter === "all" ? " active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({data.total_count})
          </button>
          <button
            type="button"
            className={`badges-filter-btn${filter === "unlocked" ? " active" : ""}`}
            onClick={() => setFilter("unlocked")}
          >
            Unlocked ({data.unlocked_count})
          </button>
          <button
            type="button"
            className={`badges-filter-btn${filter === "locked" ? " active" : ""}`}
            onClick={() => setFilter("locked")}
          >
            In Progress ({data.total_count - data.unlocked_count})
          </button>
        </div>
      </div>

      <div className="badges-grid">
        {filteredBadges.map((badge: BadgeItem) => {
          const cardClass = `badge-card ${badge.unlocked ? `unlocked tier-${badge.tier}` : "locked"}`;
          return (
            <div key={badge.id} className={cardClass}>
              <div className="badge-top-row">
                <div className="badge-icon-box">
                  {badge.unlocked ? renderBadgeIcon(badge.icon) : <Lock className="h-5 w-5" />}
                </div>
                <div className="badge-title-wrap">
                  <div className="flex items-center justify-between gap-1">
                    <span className="badge-title">{badge.title}</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      {badge.tier}
                    </span>
                  </div>
                  <p className="badge-desc">{badge.description}</p>
                </div>
              </div>

              <div className="badge-footer">
                {badge.unlocked ? (
                  <div className="badge-unlocked-tag">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Unlocked</span>
                  </div>
                ) : (
                  <div className="badge-progress-wrap">
                    <div className="badge-progress-label">
                      <span>Progress</span>
                      <span>{badge.current_value} / {badge.target_value}</span>
                    </div>
                    <ProgressBar value={badge.progress} label={`${badge.title} progress`} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
