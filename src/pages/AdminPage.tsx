import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useInvalidateScans } from "@/hooks/useScanData";
import { ArrowLeft, Users, BarChart3, Fish, Activity, TrendingUp, Clock, Shield, ShieldCheck, ShieldOff, MapPin, Edit3 } from "lucide-react";
import { EditLocationDialog } from "@/components/EditLocationDialog";
import { normalizeSpeciesName, normalizeLocationName } from "@/lib/speciesNormalize";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line,
} from "recharts";

interface UserProfile {
  user_id: string;
  email: string;
  display_name: string;
  created_at: string;
  scan_count: number;
  avg_freshness: number;
  last_scan: string | null;
  role: "admin" | "user";
}

interface ScanRow {
  id: string;
  user_id: string;
  species_name: string;
  freshness_level: string;
  freshness_score: number;
  timestamp: number;
  created_at: string;
  location_name: string | null;
}

const COLORS = [
  "hsl(204, 100%, 61%)",
  "hsl(145, 65%, 45%)",
  "hsl(45, 95%, 55%)",
  "hsl(0, 85%, 60%)",
  "hsl(260, 70%, 60%)",
  "hsl(180, 60%, 50%)",
];

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [editLocOpen, setEditLocOpen] = useState(false);

  const { data: isAdminCached, isLoading: adminLoading } = useIsAdmin();
  const invalidateScans = useInvalidateScans();

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdminCached) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setIsAdmin(true);
    loadData();
  }, [user, isAdminCached, adminLoading]);

  const loadData = async () => {
    // Fetch all profiles, scans, and roles in parallel
    const [profilesRes, scansRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("scan_history").select("user_id, species_name, freshness_level, freshness_score, timestamp, created_at, location_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const profiles = profilesRes.data ?? [];
    const allScans = (scansRes.data ?? []) as ScanRow[];
    const allRoles = rolesRes.data ?? [];
    setScans(allScans);

    // Build role map
    const roleMap = new Map<string, "admin" | "user">();
    allRoles.forEach((r: any) => {
      if (r.role === "admin") roleMap.set(r.user_id, "admin");
      else if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, "user");
    });

    // Merge user stats
    const userStats: UserProfile[] = profiles.map((p: any) => {
      const userScans = allScans.filter((s) => s.user_id === p.user_id);
      const avgFreshness = userScans.length > 0
        ? Math.round(userScans.reduce((sum, s) => sum + Number(s.freshness_score ?? 0), 0) / userScans.length)
        : 0;
      const lastScan = userScans.length > 0
        ? new Date(Math.max(...userScans.map((s) => Number(s.timestamp)))).toLocaleDateString()
        : null;
      return {
        user_id: p.user_id,
        email: p.email ?? "",
        display_name: p.display_name ?? "",
        created_at: p.created_at,
        scan_count: userScans.length,
        avg_freshness: avgFreshness,
        last_scan: lastScan,
        role: roleMap.get(p.user_id) ?? "user",
      };
    });

    setUsers(userStats);
    setLoading(false);
  };

  const toggleRole = async (targetUserId: string, currentRole: "admin" | "user") => {
    if (targetUserId === user!.id) {
      toast.error("You cannot change your own role");
      return;
    }
    const newRole = currentRole === "admin" ? "user" : "admin";
    
    if (currentRole === "admin") {
      // Remove admin role, keep user role
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId)
        .eq("role", "admin");
      if (error) { toast.error("Failed to update role"); return; }
    } else {
      // Add admin role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: targetUserId, role: "admin" });
      if (error) { toast.error("Failed to update role"); return; }
    }

    setUsers(prev => prev.map(u => u.user_id === targetUserId ? { ...u, role: newRole } : u));
    toast.success(`${newRole === "admin" ? "Promoted" : "Demoted"} user to ${newRole}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Fish className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-destructive/50 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground text-sm">You don't have admin privileges.</p>
          <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
        </div>
      </div>
    );
  }

  // Stats
  const totalScans = scans.length;
  const totalUsers = users.length;
  const avgFreshnessAll = totalScans > 0
    ? Math.round(scans.reduce((s, r) => s + Number(r.freshness_score ?? 0), 0) / totalScans)
    : 0;
  const activeUsers = users.filter((u) => u.scan_count > 0).length;

  // Species distribution
  const speciesMap = new Map<string, number>();
  scans.forEach((s) => {
    const name = normalizeSpeciesName(s.species_name || "Unknown");
    speciesMap.set(name, (speciesMap.get(name) ?? 0) + 1);
  });
  const speciesData = Array.from(speciesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Freshness distribution
  const freshnessDistData = [
    { name: "Fresh", value: scans.filter((s) => s.freshness_level === "fresh").length, fill: "hsl(145, 65%, 45%)" },
    { name: "Moderate", value: scans.filter((s) => s.freshness_level === "moderate").length, fill: "hsl(45, 95%, 55%)" },
    { name: "Poor", value: scans.filter((s) => s.freshness_level === "poor").length, fill: "hsl(0, 85%, 60%)" },
  ].filter((d) => d.value > 0);

  // Scans over time (last 14 days)
  const now = Date.now();
  const dayMs = 86400000;
  const dailyScans: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = now - i * dayMs;
    const dayEnd = dayStart + dayMs;
    const count = scans.filter((s) => Number(s.timestamp) >= dayStart && Number(s.timestamp) < dayEnd).length;
    dailyScans.push({
      date: new Date(dayStart).toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
      count,
    });
  }

  // Location distribution
  const locationMap = new Map<string, number>();
  scans.forEach((s) => {
    const loc = s.location_name ? normalizeLocationName(s.location_name) : "Unknown Location";
    locationMap.set(loc, (locationMap.get(loc) ?? 0) + 1);
  });
  const locationData = Array.from(locationMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // User activity ranking
  const topUsers = [...users].sort((a, b) => b.scan_count - a.scan_count).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-white/10 shadow-lg backdrop-blur-xl" style={{ background: 'linear-gradient(135deg, hsl(204, 100%, 61%) 0%, hsl(214, 100%, 50%) 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl text-white hover:bg-white/20" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-white" />
              <h1 className="text-lg font-bold text-white tracking-tight">Admin Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/30 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalScans}</p>
                  <p className="text-xs text-muted-foreground">Total Scans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{avgFreshnessAll}%</p>
                  <p className="text-xs text-muted-foreground">Avg Freshness</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{activeUsers}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Scan Activity */}
          <Card className="border-border/30 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Scan Activity (14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyScans}>
                    <defs>
                      <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(204, 100%, 61%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(204, 100%, 61%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid hsl(210, 30%, 85%)", background: "hsl(0, 0%, 100%)" }} />
                    <Area type="monotone" dataKey="count" name="Scans" stroke="hsl(204, 100%, 61%)" strokeWidth={2} fill="url(#scanGrad)" dot={{ r: 3, fill: "hsl(204, 100%, 61%)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Freshness Distribution */}
          <Card className="border-border/30 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Fish className="w-4 h-4 text-success" />
                Freshness Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                {freshnessDistData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={freshnessDistData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {freshnessDistData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Distribution */}
        <Card className="border-border/30 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Location Distribution ({locationData.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {locationData.length > 0 ? (
                <div style={{ height: Math.max(208, locationData.length * 32) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                      <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="value" name="Scans" radius={[0, 6, 6, 0]}>
                        {locationData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">No data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Species + Top Users */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Species Distribution */}
          <Card className="border-border/30 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Fish className="w-4 h-4 text-primary" />
                Species Scanned ({speciesData.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                {speciesData.length > 0 ? (
                  <div style={{ height: Math.max(208, speciesData.length * 32) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={speciesData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                        <Tooltip />
                        <Bar dataKey="value" name="Scans" radius={[0, 6, 6, 0]}>
                          {speciesData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">No data yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Users */}
          <Card className="border-border/30 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                User Activity Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {topUsers.map((u, i) => (
                  <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{u.display_name || u.email}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-primary">{u.scan_count}</p>
                      <p className="text-[10px] text-muted-foreground">scans</p>
                    </div>
                  </div>
                ))}
                {topUsers.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">No users yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Users Table */}
        <Card className="border-border/30 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              All Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left p-3 text-xs text-muted-foreground font-semibold">User</th>
                    <th className="text-left p-3 text-xs text-muted-foreground font-semibold">Email</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-semibold">Role</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-semibold">Scans</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-semibold">Avg Freshness</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-semibold">Last Scan</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-xs font-semibold text-foreground">{u.display_name || "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground">{u.email}</td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 gap-1 text-[11px] font-semibold rounded-lg ${
                            u.role === "admin"
                              ? "bg-primary/15 text-primary hover:bg-primary/25"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          } ${u.user_id === user!.id ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={() => toggleRole(u.user_id, u.role)}
                          disabled={u.user_id === user!.id}
                          title={u.user_id === user!.id ? "Cannot change your own role" : `Click to ${u.role === "admin" ? "demote to user" : "promote to admin"}`}
                        >
                          {u.role === "admin" ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                          {u.role}
                        </Button>
                      </td>
                      <td className="p-3 text-center text-xs font-bold text-primary">{u.scan_count}</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-bold ${u.avg_freshness >= 70 ? "text-success" : u.avg_freshness >= 40 ? "text-warning" : "text-destructive"}`}>
                          {u.scan_count > 0 ? `${u.avg_freshness}%` : "—"}
                        </span>
                      </td>
                      <td className="p-3 text-center text-xs text-muted-foreground">{u.last_scan ?? "Never"}</td>
                      <td className="p-3 text-center text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPage;
