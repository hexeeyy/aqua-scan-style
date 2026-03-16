import { useMemo, type ReactNode } from "react";

import { Activity, Cpu, Database, Fish, Waves, Thermometer, BarChart3, TrendingUp } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import type { ScanRecord } from "@/components/ScanHistory";
import { useScanHistory } from "@/hooks/useScanData";

const spectrumData = [
  { nm: "380", r: 12, g: 8, b: 45 },
  { nm: "420", r: 18, g: 14, b: 72 },
  { nm: "460", r: 22, g: 38, b: 85 },
  { nm: "500", r: 15, g: 65, b: 58 },
  { nm: "540", r: 28, g: 82, b: 35 },
  { nm: "580", r: 72, g: 78, b: 18 },
  { nm: "620", r: 88, g: 42, b: 12 },
  { nm: "660", r: 92, g: 22, b: 8 },
  { nm: "700", r: 68, g: 12, b: 5 },
];

// Shared dashboard data context — now uses React Query via useScanHistory
interface DashboardData {
  history: ScanRecord[];
  hasNewData: boolean;
}

export const DashboardDataProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

const useHistoryStats = () => {
  const { data: history = [], isFetching } = useScanHistory();
  const hasNewData = isFetching;

  return useMemo(() => {
    const total = history.length;

    const speciesSet = new Set(history.map((s) => s.species.name));
    const avgScore = total > 0 ? Math.round(history.reduce((sum, s) => sum + s.freshness.score, 0) / total * 10) / 10 : 0;

    const fresh = history.filter((s) => s.freshness.level === "fresh").length;
    const moderate = history.filter((s) => s.freshness.level === "moderate").length;
    const poor = history.filter((s) => s.freshness.level === "poor").length;
    const freshPct = total > 0 ? Math.round((fresh / total) * 100) : 0;
    const modPct = total > 0 ? Math.round((moderate / total) * 100) : 0;
    const poorPct = total > 0 ? 100 - freshPct - modPct : 0;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts: Record<string, number> = {};
    dayNames.forEach((d) => (dayCounts[d] = 0));
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    history.filter((s) => s.timestamp >= weekAgo).forEach((s) => {
      const day = dayNames[new Date(s.timestamp).getDay()];
      dayCounts[day]++;
    });
    const scanActivity = dayNames.map((day) => ({ day, scans: dayCounts[day] }));

    return { total, species: speciesSet.size, avgScore, freshPct, modPct, poorPct, scanActivity, hasNewData };
  }, [history, hasNewData]);
};

const radarData = [
  { metric: "Eye Clarity", value: 88 },
  { metric: "Gill Color", value: 76 },
  { metric: "Skin Texture", value: 92 },
  { metric: "Odor Score", value: 70 },
  { metric: "Firmness", value: 85 },
  { metric: "Scale Integrity", value: 81 },
];

const StatusDot = ({ status }: { status: "online" | "warning" | "idle" }) => {
  const colors = {
    online: "bg-emerald-400 shadow-emerald-400/50",
    warning: "bg-amber-400 shadow-amber-400/50",
    idle: "bg-slate-400 shadow-slate-400/50",
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[status]}`} />;
};

export const SystemOverview = () => (
  <section className="glass-effect rounded-xl p-3 border border-border/50 shadow-md h-full">
    <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 tracking-tight">
      <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
        <Cpu className="w-3 h-3 text-primary" />
      </div>
      System Overview
    </h3>
    <div className="grid grid-cols-2 gap-2">
      {[
        { label: "AI Engine", value: "Active", icon: Activity, status: "online" as const },
        { label: "Camera Module", value: "Ready", icon: Fish, status: "online" as const },
        { label: "Database", value: "Connected", icon: Database, status: "online" as const },
        { label: "Temp Sensor", value: "Unavailable", icon: Thermometer, status: "warning" as const },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30">
          <item.icon className="w-3 h-3 text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
            <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
              <StatusDot status={item.status} /> {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export const ScanActivityChart = () => {
  const { scanActivity } = useHistoryStats();
  return (
     <section className="glass-effect rounded-xl p-3 border border-border/50 shadow-md h-full">
      <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 tracking-tight">
        <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
          <BarChart3 className="w-3 h-3 text-primary" />
        </div>
        Weekly Scan Activity
      </h3>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scanActivity}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={20} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export const SpectrumAnalysis = () => (
  <section className="glass-effect rounded-xl p-3 border border-border/50 shadow-md h-full">
    <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 tracking-tight">
      <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
        <Waves className="w-3 h-3 text-primary" />
      </div>
      Color Spectrum Analysis
    </h3>
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={spectrumData}>
          <defs>
            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
          <XAxis dataKey="nm" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
          <Area type="monotone" dataKey="r" stroke="#ef4444" fill="url(#redGrad)" strokeWidth={1.5} />
          <Area type="monotone" dataKey="g" stroke="#22c55e" fill="url(#greenGrad)" strokeWidth={1.5} />
          <Area type="monotone" dataKey="b" stroke="#3b82f6" fill="url(#blueGrad)" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="flex justify-center gap-3 mt-1">
      <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-red-500" />Red</span>
      <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-green-500" />Green</span>
      <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-blue-500" />Blue</span>
    </div>
  </section>
);

export const FreshnessDistribution = () => {
  const { freshPct, modPct, poorPct } = useHistoryStats();
  const distribution = [
    { label: "Fresh", count: freshPct, fill: "hsl(142, 76%, 45%)" },
    { label: "Moderate", count: modPct, fill: "hsl(45, 93%, 55%)" },
    { label: "Poor", count: poorPct, fill: "hsl(0, 84%, 60%)" },
  ];
  return (
    <section className="glass-effect rounded-xl p-3 border border-border/50 shadow-md h-full">
      <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 tracking-tight">
        <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
          <TrendingUp className="w-3 h-3 text-primary" />
        </div>
        Freshness Distribution
      </h3>
      <div className="space-y-1.5">
        {distribution.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-14">{item.label}</span>
            <div className="flex-1 h-3 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${item.count}%`, backgroundColor: item.fill }}
              />
            </div>
            <span className="text-[10px] font-bold text-foreground w-7 text-right">{item.count}%</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export const QualityRadar = () => (
  <section className="glass-effect rounded-xl p-3 border border-border/50 shadow-md h-full">
    <h3 className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5 tracking-tight">
      <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
        <Activity className="w-3 h-3 text-primary" />
      </div>
      Quality Metrics Radar
    </h3>
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 7, fill: "hsl(var(--muted-foreground))" }} />
          <Radar
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </section>
);

export const LiveStats = () => {
  const { total, species, avgScore, hasNewData } = useHistoryStats();
  return (
    <section className={`glass-effect rounded-xl p-3 border shadow-md h-full transition-all duration-500 ${hasNewData ? "border-primary ring-2 ring-primary/30" : "border-border/50"}`}>
      <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 tracking-tight">
        <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
          <Database className="w-3 h-3 text-primary" />
        </div>
        Live Statistics
        <span className="ml-auto flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${hasNewData ? "bg-emerald-400 animate-ping" : "bg-emerald-400"}`} />
          <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 absolute`} style={{ marginLeft: 0 }} />
          <span className="text-[8px] font-semibold text-emerald-500 uppercase tracking-widest">Live</span>
        </span>
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Scans", value: total.toLocaleString() },
          { label: "Species Found", value: String(species) },
          { label: "Avg Score", value: String(avgScore) },
        ].map((stat) => (
          <div key={stat.label} className={`text-center p-1.5 rounded-lg transition-colors duration-500 ${hasNewData ? "bg-primary/10" : "bg-muted/30"}`}>
            <p className="text-lg font-bold text-primary leading-none">{stat.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
