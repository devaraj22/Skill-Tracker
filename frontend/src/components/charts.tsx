import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui";
import styles from "./charts.module.css";

const BRAND = "#4f46e5";

function chartHeightClass(height: number) {
  if (height >= 300) return styles.chartExtraTall;
  if (height >= 260) return styles.chartRotated;
  if (height >= 240) return styles.chartTall;
  return styles.chartDefault;
}

export function BarCard({
  title,
  data,
  xKey,
  yKey,
  unit,
  horizontal,
  height = 240,
  rotateLabels,
}: {
  title: string;
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  unit?: string;
  horizontal?: boolean;
  height?: number;
  rotateLabels?: boolean;
}) {
  const maxLabelLen = Math.max(0, ...data.map((d) => String(d[xKey] ?? "").length));
  const shouldRotate = !horizontal && (rotateLabels || (maxLabelLen > 10 && data.length > 2));
  const effectiveHeight = shouldRotate && height === 240 ? 270 : height;

  const formatXAxisTick = (val: string | number) => {
    const s = String(val ?? "");
    if (s === "Artificial Intelligence and Data Science") return "AI & Data Science";
    if (s === "Information Technology") return "Information Tech";
    if (s.length > 20) {
      return s.slice(0, 18) + "…";
    }
    return s;
  };

  const formatYAxisTick = (val: string | number) => {
    const s = String(val ?? "");
    if (s.length > 18) {
      return s.slice(0, 16) + "…";
    }
    return s;
  };

  return (
    <Card>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      {/* A text alternative for screen readers; the chart itself is decorative. */}
      <ul className="sr-only">{data.map((d) => <li key={String(d[xKey])}>{String(d[xKey])}: {d[yKey]}{unit}</li>)}</ul>
      <div aria-hidden className={`${styles.chart} ${chartHeightClass(effectiveHeight)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={{
              top: 5,
              right: 8,
              left: horizontal ? 24 : 0,
              bottom: shouldRotate ? 35 : 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={!horizontal} vertical={!!horizontal} />
            {horizontal ? (
              <>
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey={xKey} width={120} tick={{ fontSize: 12 }} tickFormatter={formatYAxisTick} />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={shouldRotate ? -30 : 0}
                  textAnchor={shouldRotate ? "end" : "middle"}
                  height={shouldRotate ? 60 : 30}
                  tickFormatter={shouldRotate ? formatXAxisTick : undefined}
                />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              </>
            )}
            <Tooltip formatter={(v: number) => `${v}${unit ?? ""}`} />
            <Bar dataKey={yKey} fill={BRAND} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function LineCard({ title, data, height = 220 }: { title: string; data: { date: string; percent: number }[]; height?: number }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <ul className="sr-only">{data.map((d) => <li key={d.date + d.percent}>{d.date}: {d.percent}%</li>)}</ul>
      <div aria-hidden className={`${styles.chart} ${chartHeightClass(height)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Line type="monotone" dataKey="percent" stroke={BRAND} strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
