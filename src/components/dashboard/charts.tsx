"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = { borderRadius: 12, border: "1px solid rgb(var(--border))", background: "rgb(var(--card))", color: "rgb(var(--foreground))", fontSize: 12 };

export function ActivityAreaChart({ data }: { data: { label: string; minutes: number; items: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "rgb(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "rgb(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="minutes" name="Minutes studied" stroke="#6366f1" strokeWidth={2.5} fill="url(#g1)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WeeklyBarChart({ data }: { data: { label: string; sessions: number; items: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "rgb(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "rgb(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgb(var(--muted))" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="sessions" name="Sessions" fill="#6366f1" radius={[6, 6, 0, 0]} />
        <Bar dataKey="items" name="Items reviewed" fill="#ec4899" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScoreLineChart({ data }: { data: { title: string; percentage: number; completedAt: string | Date }[] }) {
  const rows = data.map((d, i) => ({ ...d, idx: `#${i + 1}`, date: new Date(d.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={rows} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "rgb(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "rgb(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Score"]} labelFormatter={(_, p) => (p?.[0]?.payload as { title: string })?.title ?? ""} />
        <Line type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SubjectBarChart({ data }: { data: { subject: string; avg: number; color: string; attempts: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: "rgb(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="subject" width={100} tick={{ fontSize: 12, fill: "rgb(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Math.round(Number(v))}%`, "Avg score"]} cursor={{ fill: "rgb(var(--muted))" }} />
        <Bar dataKey="avg" radius={[0, 6, 6, 0]}>{data.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MasteryPieChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} stroke="none">
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
