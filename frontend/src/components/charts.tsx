import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui";
import styles from "./charts.module.css";

const BRAND = "#4f46e5";

function chartHeightClass(height: number) {
  if (height >= 300) return styles.chartExtraTall;
  if (height >= 240) return styles.chartTall;
  return styles.chartDefault;
}

export function BarCard({ title, data, xKey, yKey, unit, horizontal, height = 240 }: {
  title: string; data: Record<string, string | number>[]; xKey: string; yKey: string; unit?: string; horizontal?: boolean; height?: number;
}) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      {/* A text alternative for screen readers; the chart itself is decorative. */}
      <ul className="sr-only">{data.map((d) => <li key={String(d[xKey])}>{String(d[xKey])}: {d[yKey]}{unit}</li>)}</ul>
      <div aria-hidden className={`${styles.chart} ${chartHeightClass(height)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 24 : 0, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={!horizontal} vertical={!!horizontal} />
            {horizontal ? <><XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} /><YAxis type="category" dataKey={xKey} width={110} tick={{ fontSize: 12 }} /></>
              : <><XAxis dataKey={xKey} tick={{ fontSize: 12 }} interval={0} /><YAxis tick={{ fontSize: 12 }} allowDecimals={false} /></>}
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
