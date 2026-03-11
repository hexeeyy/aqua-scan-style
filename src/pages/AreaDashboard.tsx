import { useState, useEffect, useMemo } from "react";
import { MapPin, Fish, TrendingUp, BarChart3, RefreshCw, Edit3, Locate, DollarSign, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 76%, 45%)",
  "hsl(45, 93%, 55%)",
  "hsl(0, 84%, 60%)",
  "hsl(260, 70%, 60%)",
  "hsl(200, 80%, 50%)",
  "hsl(30, 90%, 55%)",
  "hsl(320, 70%, 55%)",
];

const AreaDashboard = () => {
  const { user } = useAuth();
  const { location, loading: locLoading, detectLocation, setManualLocation } = useUserLocation();
  const [scans, setScans] = useState<AreaScan[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check admin role
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .then(({ data }) => setIsAdmin((data ?? []).length > 0));
  }, [user]);

  // Fetch scans
  useEffect(() => {
    const fetchScans = async () => {
      let query = supabase
        .from("scan_history")
        .select("id, species_name, freshness_level, freshness_score, price_min, price_max, location_name, timestamp, user_id")
        .not("location_name", "is", null)
        .order("timestamp", { ascending: false })
        .limit(500);

      // Non-admin users only see own scans
      if (!isAdmin) {
        query = query.eq("user_id", user?.id ?? "");
      }

      const { data } = await query;
      const rows = (data ?? []) as AreaScan[];
      setScans(rows);

      const locs = [...new Set(rows.map((r) => r.location_name).filter(Boolean))] as string[];
      setAllLocations(locs);
    };

    if (!user) return;
    fetchScans();

    // Realtime subscription to keep dashboard synced with scan history
    const channel = supabase
      .channel('area-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scan_history' }, () => {
        console.log('[Realtime] scan_history changed, refreshing area dashboard...');
        fetchScans();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isAdmin]);

  // Auto-select user's location
  useEffect(() => {
    if (location?.locationName && !isAdmin) {
      setSelectedArea(location.locationName);
    }
  }, [location, isAdmin]);

  const filtered = useMemo(() => {
    if (selectedArea === "all") return scans;
    return scans.filter((s) => s.location_name === selectedArea);
  }, [scans, selectedArea]);

  // Species count
  const speciesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((s) => {
      if (s.species_name) counts[s.species_name] = (counts[s.species_name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [filtered]);

  // Freshness breakdown
  const freshnessData = useMemo(() => {
    const counts = { fresh: 0, moderate: 0, poor: 0 };
    filtered.forEach((s) => {
      const lvl = s.freshness_level as keyof typeof counts;
      if (lvl in counts) counts[lvl]++;
    });
    return [
      { name: "Fresh", value: counts.fresh, fill: "hsl(142, 76%, 45%)" },
      { name: "Moderate", value: counts.moderate, fill: "hsl(45, 93%, 55%)" },
      { name: "Poor", value: counts.poor, fill: "hsl(0, 84%, 60%)" },
    ].filter((d) => d.value > 0);
  }, [filtered]);

  // Avg freshness score
  const avgFreshness = useMemo(() => {
    const scored = filtered.filter((s) => s.freshness_score != null);
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
    const days: { date: string; scans: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const count = filtered.filter((s) => s.timestamp >= dayStart && s.timestamp < dayEnd).length;
      days.push({ date: key, scans: count });
    }
    return days;
  }, [filtered]);

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

        {/* Area selector (admin sees all areas, user sees own areas) */}
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
            {/* Quick stats row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: "Total Scans", value: filtered.length.toLocaleString(), icon: BarChart3 },
                { label: "Species Found", value: String(new Set(filtered.map((s) => s.species_name).filter(Boolean)).size), icon: Fish },
                { label: "Avg Freshness", value: `${avgFreshness}%`, icon: Activity },
                { label: "Avg Price", value: avgPrice ? `₱${avgPrice}/kg` : "N/A", icon: DollarSign },
              ].map((stat) => (
                <Card key={stat.label} className="border-border/50">
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <stat.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground leading-none">{stat.value}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Species count bar chart */}
              <Card className="border-border/50">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <Fish className="w-3.5 h-3.5 text-primary" />
                    Species Scanned
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={speciesData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                        <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Freshness pie chart */}
              <Card className="border-border/50">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
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
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5">
                      {freshnessData.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                          <span className="text-muted-foreground">{d.name}</span>
                          <span className="font-bold text-foreground">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Scan volume over time */}
            <Card className="border-border/50 mb-3">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  Scan Volume (Last 14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData}>
                      <defs>
                        <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={20} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                      <Area type="monotone" dataKey="scans" stroke="hsl(var(--primary))" fill="url(#volumeGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Price trends per species */}
            {speciesData.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                    Average Price by Species (₱/kg)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={speciesData.map((s) => {
                          const speciesScans = filtered.filter((sc) => sc.species_name === s.name && sc.price_min != null);
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
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v: number) => [`₱${v}`, "Avg Price"]} />
                        <Bar dataKey="price" fill="hsl(142, 76%, 45%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AreaDashboard;
