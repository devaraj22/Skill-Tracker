import { Calendar, Flame, TrendingUp, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import type { ActivityHeatmapData } from "@/types";
import "./ActivityHeatmap.css";

interface ActivityHeatmapProps {
  data: ActivityHeatmapData;
  title?: string;
}

function getLevelClass(count: number): string {
  if (count <= 0) return "heatmap-cell-0";
  if (count <= 2) return "heatmap-cell-1";
  if (count <= 4) return "heatmap-cell-2";
  if (count <= 6) return "heatmap-cell-3";
  return "heatmap-cell-4";
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ActivityHeatmap({ data, title = "Learning Activity & Streaks" }: ActivityHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (!data?.daily_counts || typeof data.daily_counts !== "object" || !data?.end_date) {
    return null;
  }

  // Generate 52 weeks (364 days) leading up to today
  const days = useMemo(() => {
    const list: { dateStr: string; count: number }[] = [];
    const end = new Date(data.end_date + "T00:00:00");

    // Align start to the nearest prior Sunday for a clean calendar grid
    const start = new Date(end);
    start.setDate(end.getDate() - 363);
    const dayOfWeek = start.getDay(); // 0 is Sunday
    start.setDate(start.getDate() - dayOfWeek);

    const curr = new Date(start);
    while (curr <= end) {
      const dateStr = curr.toISOString().split("T")[0] || "";
      if (dateStr) {
        list.push({
          dateStr,
          count: data.daily_counts[dateStr] ?? 0,
        });
      }
      curr.setDate(curr.getDate() + 1);
    }
    return list;
  }, [data.daily_counts, data.end_date]);

  const activeHover = selectedDate ? {
    date: formatDayLabel(selectedDate),
    count: data.daily_counts[selectedDate] ?? 0,
  } : null;

  return (
    <div className="heatmap-container">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-500">Last 365 Days</span>
      </div>

      <div className="heatmap-stats-row">
        <div className="heatmap-stat-card">
          <div className="heatmap-stat-icon-wrap flame">
            <Flame className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div className="heatmap-stat-label">Current Streak</div>
            <div className="heatmap-stat-value">{data.current_streak} {data.current_streak === 1 ? "day" : "days"}</div>
          </div>
        </div>

        <div className="heatmap-stat-card">
          <div className="heatmap-stat-icon-wrap zap">
            <Zap className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div className="heatmap-stat-label">Longest Streak</div>
            <div className="heatmap-stat-value">{data.longest_streak} {data.longest_streak === 1 ? "day" : "days"}</div>
          </div>
        </div>

        <div className="heatmap-stat-card">
          <div className="heatmap-stat-icon-wrap">
            <TrendingUp className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div className="heatmap-stat-label">Total Activities</div>
            <div className="heatmap-stat-value">{data.total_activities}</div>
          </div>
        </div>

        <div className="heatmap-stat-card">
          <div className="heatmap-stat-icon-wrap calendar">
            <Calendar className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div className="heatmap-stat-label">Active Days</div>
            <div className="heatmap-stat-value">{data.active_days}</div>
          </div>
        </div>
      </div>

      <div className="heatmap-scroll-area">
        <div className="heatmap-grid" role="grid" aria-label="Annual activity contribution grid">
          {days.map((d) => {
            const levelClass = getLevelClass(d.count);
            const isSelected = selectedDate === d.dateStr;
            const fullClass = `heatmap-cell ${levelClass}${isSelected ? " selected" : ""}`;
            const labelText = `${d.count} activities on ${formatDayLabel(d.dateStr)}`;

            return (
              <button
                key={d.dateStr}
                type="button"
                className={fullClass}
                title={labelText}
                aria-label={labelText}
                onMouseEnter={() => setSelectedDate(d.dateStr)}
                onFocus={() => setSelectedDate(d.dateStr)}
                onClick={() => setSelectedDate(d.dateStr)}
              />
            );
          })}
        </div>
      </div>

      {activeHover && (
        <div className="heatmap-tooltip-bar">
          <strong>{activeHover.count} {activeHover.count === 1 ? "activity" : "activities"}</strong> on {activeHover.date}
        </div>
      )}

      <div className="heatmap-legend">
        <span>Less</span>
        <span className="heatmap-legend-cell heatmap-cell-0" />
        <span className="heatmap-legend-cell heatmap-cell-1" />
        <span className="heatmap-legend-cell heatmap-cell-2" />
        <span className="heatmap-legend-cell heatmap-cell-3" />
        <span className="heatmap-legend-cell heatmap-cell-4" />
        <span>More</span>
      </div>
    </div>
  );
}
