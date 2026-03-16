import { useState, useEffect, useMemo } from "react";
import { EditLocationDialog } from "@/components/EditLocationDialog";
import {
  MapPin, Fish, TrendingUp, BarChart3, Edit3, Locate, DollarSign, Activity,
  Droplets, ThermometerSun, Eye, ShieldCheck, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Navbar } from "@/components/Navbar";
import { normalizeSpeciesName, countUniqueSpecies, normalizeLocationName } from "@/lib/speciesNormalize";
import { Footer } from "@/components/Footer";
import { useAreaScans, useIsAdmin, useInvalidateScans } from "@/hooks/useScanData";

interface AreaScan {
  id: string;
  species_name: string | null;
  freshness_level: string | null;
  freshness_score: number | null;
  price_min: number | null;
  price_max: number | null;
  location_name: string | null;
  timestamp: number;
  user_id: string;
}

const FRESHNESS_COLORS = {
  fresh: "hsl(142, 76%, 45%)",
  moderate: "hsl(45, 93%, 55%)",
  poor: "hsl(0, 84%, 60%)",
};

const SPECIES_COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 76%, 45%)",
  "hsl(45, 93%, 55%)",
  "hsl(260, 70%, 60%)",
  "hsl(200, 80%, 50%)",
  "hsl(30, 90%, 55%)",
  "hsl(320, 70%, 55%)",
  "hsl(0, 84%, 60%)",
];

const tooltipStyle = {
  fontSize: 11,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
};

const AreaDashboard = () => {
  const { user } = useAuth();
  const { location, loading: locLoading, detectLocation, setManualLocation } = useUserLocation();
  const { data: isAdmin = false } = useIsAdmin();
  const { data: areaScans = [] } = useAreaScans();
  const scans = areaScans;
  const allLocations = useMemo(() => [...new Set(scans.map((r) => r.location_name ? normalizeLocationName(r.location_name) : "Unknown Location"))] as string[], [scans]);
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [editingLocation, setEditingLocation] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editLocOpen, setEditLocOpen] = useState(false);
  const invalidateScans = useInvalidateScans();

  useEffect(() => {
    if (location?.locationName && !isAdmin) {
      setSelectedArea(normalizeLocationName(location.locationName));
    }
  }, [location, isAdmin]);

  const filtered = useMemo(() => {
    if (selectedArea === "all") return scans;
    if (selectedArea === "Unknown Location") return scans.filter((s) => !s.location_name);
    return scans.filter((s) => s.location_name && normalizeLocationName(s.location_name) === selectedArea);
  }, [scans, selectedArea]);

  // Species count
  const speciesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((s) => {
      if (s.species_name) {
        const name = normalizeSpeciesName(s.species_name);
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [filtered]);

  // Freshness breakdown
  const freshnessData = useMemo(() => {
    const counts = { fresh: 0, moderate: 0, poor: 0 };
    filtered.forEach((s) => {
      const lvl = (s.freshness_level || "").toLowerCase() as keyof typeof counts;
      if (lvl in counts) counts[lvl]++;
    });
    return [
      { name: "Fresh", value: counts.fresh, fill: FRESHNESS_COLORS.fresh },
      { name: "Moderate", value: counts.moderate, fill: FRESHNESS_COLORS.moderate },
      { name: "Poor", value: counts.poor, fill: FRESHNESS_COLORS.poor },
    ].filter((d) => d.value > 0);
  }, [filtered]);

  const freshCount = freshnessData.find(d => d.name === "Fresh")?.value ?? 0;
  const moderateCount = freshnessData.find(d => d.name === "Moderate")?.value ?? 0;
  const poorCount = freshnessData.find(d => d.name === "Poor")?.value ?? 0;

  // Avg freshness score
  const avgFreshness = useMemo(() => {
    const scored = filtered.filter((s) => s.freshness_score != null && s.freshness_score > 0);
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((sum, s) => sum + (s.freshness_score ?? 0), 0) / scored.length);
  }, [filtered]);

  // Avg price
  const avgPrice = useMemo(() => {
    const priced = filtered.filter((s) => s.price_min != null);
    if (priced.length === 0) return null;
    const avg = priced.reduce((sum, s) => sum + ((s.price_min ?? 0) + (s.price_max ?? 0)) / 2, 0) / priced.length;
    return Math.round(avg);
  }, [filtered]);

  // Scan volume over time (last 14 days)
  const volumeData = useMemo(() => {
    const now = Date.now();
    const days: { date: string; fresh: number; moderate: number; poor: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const dayScans = filtered.filter((s) => s.timestamp >= dayStart && s.timestamp < dayEnd);
      days.push({
        date: key,
        fresh: dayScans.filter(s => (s.freshness_level || "").toLowerCase() === "fresh").length,
        moderate: dayScans.filter(s => (s.freshness_level || "").toLowerCase() === "moderate").length,
        poor: dayScans.filter(s => (s.freshness_level || "").toLowerCase() === "poor").length,
      });
    }
    return days;
  }, [filtered]);

  // Freshness by species (stacked data)
  const freshnessBySpecies = useMemo(() => {
    const map: Record<string, { fresh: number; moderate: number; poor: number }> = {};
    filtered.forEach((s) => {
      if (!s.species_name) return;
      const name = normalizeSpeciesName(s.species_name);
      if (!map[name]) map[name] = { fresh: 0, moderate: 0, poor: 0 };
      const lvl = (s.freshness_level || "").toLowerCase();
      if (lvl === "fresh") map[name].fresh++;
      else if (lvl === "moderate") map[name].moderate++;
      else if (lvl === "poor") map[name].poor++;
    });
    return Object.entries(map)
      .sort((a, b) => (b[1].fresh + b[1].moderate + b[1].poor) - (a[1].fresh + a[1].moderate + a[1].poor))
      .map(([name, counts]) => ({ name, ...counts }));
  }, [filtered]);

  // Location comparison data
  const locationComparison = useMemo(() => {
    if (selectedArea !== "all") return [];
    const map: Record<string, { total: number; avgScore: number; scores: number[] }> = {};
    scans.forEach((s) => {
      const loc = s.location_name ? normalizeLocationName(s.location_name) : "Unknown";
      if (!map[loc]) map[loc] = { total: 0, avgScore: 0, scores: [] };
      map[loc].total++;
      if (s.freshness_score != null && s.freshness_score > 0) map[loc].scores.push(s.freshness_score);
    });
    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        scans: d.total,
        avgScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
      }))
      .sort((a, b) => b.scans - a.scans);
  }, [scans, selectedArea]);

  // Quality radar from scan data
  const qualityRadar = useMemo(() => {
    const freshPct = filtered.length > 0 ? (freshCount / filtered.length) * 100 : 0;
    const avgScore = avgFreshness;
    const consistency = filtered.length > 2 ? Math.min(95, 100 - (Math.abs(freshCount - moderateCount) / filtered.length) * 30) : 50;
    const coverage = Math.min(100, speciesData.length * 20);
    const sampleSize = Math.min(100, filtered.length * 2);
    return [
      { metric: "Freshness Rate", value: Math.round(freshPct) },
      { metric: "Avg Score", value: avgScore },
      { metric: "Consistency", value: Math.round(consistency) },
      { metric: "Species Coverage", value: Math.round(coverage) },
      { metric: "Sample Size", value: Math.round(sampleSize) },
    ];
  }, [filtered, freshCount, moderateCount, avgFreshness, speciesData]);

  const handleManualSave = () => {
    if (manualInput.trim()) {
      setManualLocation(manualInput.trim());
      setEditingLocation(false);
      setManualInput("");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const freshnessLabel = avgFreshness >= 80 ? "Excellent" : avgFreshness >= 60 ? "Good" : avgFreshness >= 40 ? "Fair" : "Poor";
  const freshnessColor = avgFreshness >= 80 ? "text-emerald-400" : avgFreshness >= 60 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />

      <main className="max-w-5xl mx-auto px-3 py-3 flex-1 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Area Analytics</h1>
              <p className="text-[10px] text-muted-foreground">
                {isAdmin ? "All users' scans across all areas" : "Your scans by location"}
                {filtered.length > 0 && ` • ${filtered.length} samples analyzed`}
              </p>
            </div>
          </div>

          {/* Location controls */}
          <div className="flex items-center gap-1.5">
            {!editingLocation ? (
              <>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg">
                  <MapPin className="w-3 h-3" />
                  {location?.locationName ?? "No location set"}
                </div>
                <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg" onClick={detectLocation} disabled={locLoading}>
                  <Locate className={`w-3.5 h-3.5 ${locLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg" onClick={() => { setEditingLocation(true); setManualInput(location?.locationName ?? ""); }}>
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter city/area name"
                  className="h-7 text-xs w-40"
                  onKeyDown={(e) => e.key === "Enter" && handleManualSave()}
                />
                <Button size="sm" className="h-7 text-xs" onClick={handleManualSave}>Save</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingLocation(false)}>Cancel</Button>
              </div>
            )}
          </div>
        </div>

        {/* Area selector */}
        <div className="mb-3">
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              {isAdmin && <SelectItem value="all">All Areas</SelectItem>}
              {allLocations.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
              {allLocations.length === 0 && (
                <SelectItem value="none" disabled>No scans with location</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No scans found for this area</p>
            <p className="text-xs mt-1">Scan fish with location enabled to see area analytics</p>
          </div>
        ) : (
          <>
            {/* Assign location banner */}
            {selectedArea === "Unknown Location" && (
              <div className="mb-3 p-3 rounded-xl border border-warning/30 bg-warning/5 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{filtered.length}</span> scan{filtered.length > 1 ? "s" : ""} without a location
                </p>
                <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setEditLocOpen(true)}>
                  <Edit3 className="w-3 h-3" />
                  Assign Location
                </Button>
              </div>
            )}

            {/* Quick stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {[
                { label: "Total Scans", value: filtered.length.toLocaleString(), icon: BarChart3, sub: `${speciesData.length} species` },
                { label: "Fresh Rate", value: `${filtered.length > 0 ? Math.round((freshCount / filtered.length) * 100) : 0}%`, icon: ShieldCheck, sub: `${freshCount} fresh scans` },
                { label: "Avg Freshness", value: `${avgFreshness}%`, icon: Activity, sub: freshnessLabel },
                { label: "Avg Price", value: avgPrice ? `₱${avgPrice}/kg` : "N/A", icon: DollarSign, sub: `${allLocations.length} locations` },
              ].map((stat) => (
                <Card key={stat.label} className="border-border/50 glass-effect">
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <stat.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground leading-none">{stat.value}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{stat.label}</p>
                      <p className="text-[8px] text-primary/70">{stat.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Row 1: Species + Freshness Pie */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Species count bar chart */}
              <Card className="border-border/50 glass-effect">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                      <Fish className="w-3 h-3 text-primary" />
                    </div>
                    Species Distribution ({speciesData.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="max-h-48 overflow-y-auto">
                    <div style={{ height: Math.max(144, speciesData.length * 28) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={speciesData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                          <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Freshness pie chart */}
              <Card className="border-border/50 glass-effect">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-primary" />
                    </div>
                    Freshness Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="h-36 flex items-center">
                    <ResponsiveContainer width="60%" height="100%">
                      <PieChart>
                        <Pie data={freshnessData} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                          {freshnessData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {freshnessData.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                          <div>
                            <span className="text-foreground font-semibold">{d.value}</span>
                            <span className="text-muted-foreground ml-1">{d.name}</span>
                            <span className="text-muted-foreground/70 ml-1">
                              ({filtered.length > 0 ? Math.round((d.value / filtered.length) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1 border-t border-border/30">
                        <span className={`text-[10px] font-bold ${freshnessColor}`}>
                          Overall: {freshnessLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Freshness by Species (stacked) + Quality Radar */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Card className="border-border/50 glass-effect">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                      <Layers className="w-3 h-3 text-primary" />
                    </div>
                    Freshness by Species
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="max-h-48 overflow-y-auto">
                    <div style={{ height: Math.max(144, freshnessBySpecies.length * 28) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={freshnessBySpecies} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                          <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="fresh" stackId="a" fill={FRESHNESS_COLORS.fresh} radius={[0, 0, 0, 0]} name="Fresh" />
                          <Bar dataKey="moderate" stackId="a" fill={FRESHNESS_COLORS.moderate} name="Moderate" />
                          <Bar dataKey="poor" stackId="a" fill={FRESHNESS_COLORS.poor} radius={[0, 4, 4, 0]} name="Poor" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3 mt-1.5">
                    {[
                      { label: "Fresh", color: FRESHNESS_COLORS.fresh },
                      { label: "Moderate", color: FRESHNESS_COLORS.moderate },
                      { label: "Poor", color: FRESHNESS_COLORS.poor },
                    ].map(l => (
                      <span key={l.label} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quality Radar */}
              <Card className="border-border/50 glass-effect">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                      <Activity className="w-3 h-3 text-primary" />
                    </div>
                    Quality Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={qualityRadar} cx="50%" cy="50%" outerRadius="68%">
                        <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
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
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Scan volume over time (stacked by freshness) */}
            <Card className="border-border/50 glass-effect mb-3">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-3 h-3 text-primary" />
                  </div>
                  Scan Activity (Last 14 Days)
                  <span className="ml-auto text-[9px] font-normal text-muted-foreground">
                    {volumeData.reduce((s, d) => s + d.fresh + d.moderate + d.poor, 0)} total scans
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData}>
                      <defs>
                        <linearGradient id="freshGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={FRESHNESS_COLORS.fresh} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={FRESHNESS_COLORS.fresh} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="modGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={FRESHNESS_COLORS.moderate} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={FRESHNESS_COLORS.moderate} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="poorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={FRESHNESS_COLORS.poor} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={FRESHNESS_COLORS.poor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={20} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="fresh" stackId="1" stroke={FRESHNESS_COLORS.fresh} fill="url(#freshGrad)" strokeWidth={1.5} name="Fresh" />
                      <Area type="monotone" dataKey="moderate" stackId="1" stroke={FRESHNESS_COLORS.moderate} fill="url(#modGrad)" strokeWidth={1.5} name="Moderate" />
                      <Area type="monotone" dataKey="poor" stackId="1" stroke={FRESHNESS_COLORS.poor} fill="url(#poorGrad)" strokeWidth={1.5} name="Poor" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-3 mt-1">
                  {[
                    { label: "Fresh", color: FRESHNESS_COLORS.fresh },
                    { label: "Moderate", color: FRESHNESS_COLORS.moderate },
                    { label: "Poor", color: FRESHNESS_COLORS.poor },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Row 4: Location Comparison (admin/all only) + Price by Species */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {locationComparison.length > 0 ? (
                <Card className="border-border/50 glass-effect">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-primary" />
                      </div>
                      Location Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={locationComparison} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                          <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={60} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [name === "scans" ? v : `${v}%`, name === "scans" ? "Scans" : "Avg Score"]} />
                          <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Scans" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {locationComparison.map(loc => (
                        <div key={loc.name} className="flex items-center justify-between text-[9px]">
                          <span className="text-muted-foreground">{loc.name}</span>
                          <span className={`font-bold ${loc.avgScore >= 75 ? "text-emerald-400" : loc.avgScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                            Avg: {loc.avgScore}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 glass-effect">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                        <Droplets className="w-3 h-3 text-primary" />
                      </div>
                      Freshness Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-2">
                      {[
                        { label: "Fresh", count: freshCount, pct: filtered.length > 0 ? (freshCount / filtered.length) * 100 : 0, color: FRESHNESS_COLORS.fresh },
                        { label: "Moderate", count: moderateCount, pct: filtered.length > 0 ? (moderateCount / filtered.length) * 100 : 0, color: FRESHNESS_COLORS.moderate },
                        { label: "Poor", count: poorCount, pct: filtered.length > 0 ? (poorCount / filtered.length) * 100 : 0, color: FRESHNESS_COLORS.poor },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-[10px] mb-0.5">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-bold text-foreground">{item.count} ({item.pct.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Price by Species */}
              {speciesData.length > 0 && (
                <Card className="border-border/50 glass-effect">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                        <DollarSign className="w-3 h-3 text-primary" />
                      </div>
                      Avg Price by Species (₱/kg)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={speciesData.map((s) => {
                            const speciesScans = filtered.filter((sc) => sc.species_name && normalizeSpeciesName(sc.species_name) === s.name && sc.price_min != null);
                            const avg = speciesScans.length > 0
                              ? Math.round(speciesScans.reduce((sum, sc) => sum + ((sc.price_min ?? 0) + (sc.price_max ?? 0)) / 2, 0) / speciesScans.length)
                              : 0;
                            return { name: s.name, price: avg };
                          }).filter((d) => d.price > 0)}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                          <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₱${v}`, "Avg Price"]} />
                          <Bar dataKey="price" fill="hsl(142, 76%, 45%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
        <EditLocationDialog
          open={editLocOpen}
          onOpenChange={setEditLocOpen}
          scanIds={scans.filter((s) => !s.location_name).map((s) => s.id)}
          onSuccess={invalidateScans}
        />
      </main>

      <Footer />
    </div>
  );
};

export default AreaDashboard;
