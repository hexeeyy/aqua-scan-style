import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useInvalidateScans, useScanHistory } from "@/hooks/useScanData";
import { ArrowLeft, Users, BarChart3, Fish, Activity, TrendingUp, Shield, ShieldCheck, ShieldOff, MapPin, Edit3, FlaskConical, UserCheck, UserX, Plus, Trash2, Crown, ShieldHalf } from "lucide-react";
import { ModelMetrics } from "@/components/ModelMetrics";
import { EditLocationDialog } from "@/components/EditLocationDialog";
import { normalizeSpeciesName, normalizeLocationName } from "@/lib/speciesNormalize";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

const COLORS = [
  "hsl(204, 100%, 61%)",
  "hsl(145, 65%, 45%)",
  "hsl(45, 95%, 55%)",
  "hsl(0, 85%, 60%)",
  "hsl(260, 70%, 60%)",
  "hsl(180, 60%, 50%)",
];

type AppRoleType = "super_admin" | "admin" | "moderator" | "user";

interface UserProfile {
  user_id: string;
  email: string;
  display_name: string;
  created_at: string;
  scan_count: number;
  avg_freshness: number;
  last_scan: string | null;
  role: AppRoleType;
  approved: boolean;
  location_id: string | null;
  location_name: string | null;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const invalidateScans = useInvalidateScans();
  const queryClient = useQueryClient();
  const [editLocOpen, setEditLocOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const toggleSelectUser = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((userIds: string[]) => {
    setSelectedUsers(prev => prev.size === userIds.length ? new Set() : new Set(userIds));
  }, []);

  const bulkUpdateApproval = async (approved: boolean) => {
    const ids = Array.from(selectedUsers);
    if (ids.length === 0) return;
    const promises = ids.map(id =>
      supabase.from("profiles").update({ approved }).eq("user_id", id)
    );
    const results = await Promise.all(promises);
    const failed = results.filter(r => r.error).length;
    if (failed > 0) toast.error(`${failed} update(s) failed`);
    else toast.success(`${ids.length} user(s) ${approved ? "approved" : "access revoked"}`);
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    ids.forEach(id => queryClient.invalidateQueries({ queryKey: ["approvalStatus", id] }));
    setSelectedUsers(new Set());
  };

  // Use the SAME shared hook that Home/History use
  const { data: scanHistory = [], isLoading: scansLoading } = useScanHistory();

  // Fetch profiles & roles via React Query so they also benefit from caching
  const { data: usersData = [], isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return { profiles: profilesRes.data ?? [], roles: rolesRes.data ?? [] };
    },
    enabled: !!isAdmin,
    select: (data) => {
      const roleMap = new Map<string, "admin" | "user">();
      data.roles.forEach((r: any) => {
        if (r.role === "admin") roleMap.set(r.user_id, "admin");
        else if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, "user");
      });

      return data.profiles.map((p: any): UserProfile => {
        const userScans = scanHistory.filter((s) => s.scanUserId === p.user_id);
        const avgFreshness = userScans.length > 0
          ? Math.round(userScans.reduce((sum, s) => sum + s.freshness.score, 0) / userScans.length)
          : 0;
        const lastScan = userScans.length > 0
          ? new Date(Math.max(...userScans.map((s) => s.timestamp))).toLocaleDateString()
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
          approved: p.approved ?? false,
        };
      });
    },
  });

  const users = usersData;
  const loading = adminLoading || scansLoading || usersLoading;

  // Derive all stats from the shared scanHistory data
  const scans = useMemo(() => scanHistory.map(s => ({
    id: s.id,
    user_id: s.scanUserId ?? "",
    species_name: s.species.name,
    freshness_level: s.freshness.level,
    freshness_score: s.freshness.score,
    timestamp: s.timestamp,
    location_name: (s as any).locationName ?? null,
  })), [scanHistory]);

  // We need location_name from the raw data, let's get it from the area scans query
  // Actually, scanHistory doesn't carry location_name. Let's use a separate query for location data.
  const { data: scanLocations = [] } = useQuery({
    queryKey: ["adminScanLocations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("scan_history")
        .select("id, location_name, user_id, species_name, freshness_level, freshness_score, timestamp, created_at")
        .order("timestamp", { ascending: false });
      return data ?? [];
    },
    enabled: !!isAdmin,
    staleTime: 0,
  });

  const toggleRole = async (targetUserId: string, currentRole: "admin" | "user") => {
    if (targetUserId === user!.id) {
      toast.error("You cannot change your own role");
      return;
    }
    const newRole = currentRole === "admin" ? "user" : "admin";

    if (currentRole === "admin") {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId)
        .eq("role", "admin");
      if (error) { toast.error("Failed to update role"); return; }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: targetUserId, role: "admin" });
      if (error) { toast.error("Failed to update role"); return; }
    }

    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    toast.success(`${newRole === "admin" ? "Promoted" : "Demoted"} user to ${newRole}`);
  };

  const toggleApproval = async (targetUserId: string, currentApproved: boolean) => {
    const newStatus = !currentApproved;
    const { error } = await supabase
      .from("profiles")
      .update({ approved: newStatus })
      .eq("user_id", targetUserId);
    if (error) {
      toast.error("Failed to update approval status");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    queryClient.invalidateQueries({ queryKey: ["approvalStatus", targetUserId] });
    toast.success(newStatus ? "User approved — access granted" : "User access revoked");
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

  // Use scanLocations as the primary data source (has location_name)
  const allScans = scanLocations as Array<{
    id: string;
    location_name: string | null;
    user_id: string;
    species_name: string | null;
    freshness_level: string | null;
    freshness_score: number | null;
    timestamp: number;
    created_at: string;
  }>;

  // Stats
  const totalScans = allScans.length;
  const totalUsers = users.length;
  const scoredScans = allScans.filter((s) => s.freshness_score != null && Number(s.freshness_score) > 0);
  const avgFreshnessAll = scoredScans.length > 0
    ? Math.round(scoredScans.reduce((s, r) => s + Number(r.freshness_score ?? 0), 0) / scoredScans.length * 10) / 10
    : 0;
  const pendingUsers = users.filter((u) => !u.approved);
  const activeUsers = users.filter((u) => u.scan_count > 0).length;

  // Species distribution
  const speciesMap = new Map<string, number>();
  allScans.forEach((s) => {
    const name = normalizeSpeciesName(s.species_name || "Unknown");
    speciesMap.set(name, (speciesMap.get(name) ?? 0) + 1);
  });
  const speciesData = Array.from(speciesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Freshness distribution
  const freshnessDistData = [
    { name: "Fresh", value: allScans.filter((s) => s.freshness_level === "fresh").length, fill: "hsl(145, 65%, 45%)" },
    { name: "Moderate", value: allScans.filter((s) => s.freshness_level === "moderate").length, fill: "hsl(45, 95%, 55%)" },
    { name: "Poor", value: allScans.filter((s) => s.freshness_level === "poor").length, fill: "hsl(0, 85%, 60%)" },
  ].filter((d) => d.value > 0);

  // Scans over time (last 14 days)
  const now = Date.now();
  const dayMs = 86400000;
  const dailyScans: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = now - i * dayMs;
    const dayEnd = dayStart + dayMs;
    const count = allScans.filter((s) => Number(s.timestamp) >= dayStart && Number(s.timestamp) < dayEnd).length;
    dailyScans.push({
      date: new Date(dayStart).toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
      count,
    });
  }

  // Location distribution
  const locationMap = new Map<string, number>();
  allScans.forEach((s) => {
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

        {/* Pending Approvals Alert */}
        {pendingUsers.length > 0 && (
          <Card className="border-warning/30 bg-warning/5 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <UserX className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{pendingUsers.length} Pending Approval{pendingUsers.length > 1 ? "s" : ""}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {pendingUsers.map(u => u.display_name || u.email).join(", ")}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={async () => {
                      const ids = pendingUsers.map(u => u.user_id);
                      await Promise.all(ids.map(id => supabase.from("profiles").update({ approved: true }).eq("user_id", id)));
                      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
                      ids.forEach(id => queryClient.invalidateQueries({ queryKey: ["approvalStatus", id] }));
                      toast.success(`${ids.length} user(s) approved`);
                    }}
                  >
                    <UserCheck className="w-3 h-3" />
                    Approve All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Location Distribution ({locationData.length})
              </CardTitle>
              {allScans.some((s) => !s.location_name) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] gap-1"
                  onClick={() => setEditLocOpen(true)}
                >
                  <Edit3 className="w-3 h-3" />
                  Assign Location ({allScans.filter((s) => !s.location_name).length})
                </Button>
              )}
            </div>
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                All Users ({users.length})
              </CardTitle>
              {selectedUsers.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">{selectedUsers.size} selected</span>
                  <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => bulkUpdateApproval(true)}>
                    <UserCheck className="w-3 h-3" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-[11px] gap-1" onClick={() => bulkUpdateApproval(false)}>
                    <UserX className="w-3 h-3" /> Revoke
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={() => toggleSelectAll(users.map(u => u.user_id))}
                      />
                    </th>
                    <th className="text-left p-3 text-xs text-muted-foreground font-semibold">User</th>
                    <th className="text-left p-3 text-xs text-muted-foreground font-semibold">Email</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-semibold">Access</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-semibold">Role</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-semibold">Scans</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-semibold">Avg Freshness</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-semibold">Last Scan</th>
                    <th className="text-center p-3 text-xs text-muted-foreground font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className={`border-b border-border/20 hover:bg-muted/30 transition-colors ${selectedUsers.has(u.user_id) ? "bg-primary/5" : ""}`}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                          checked={selectedUsers.has(u.user_id)}
                          onChange={() => toggleSelectUser(u.user_id)}
                        />
                      </td>
                      <td className="p-3 text-xs font-semibold text-foreground">{u.display_name || "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground">{u.email}</td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 gap-1 text-[11px] font-semibold rounded-lg ${
                            u.approved
                              ? "bg-success/15 text-success hover:bg-success/25"
                              : "bg-destructive/15 text-destructive hover:bg-destructive/25"
                          }`}
                          onClick={() => toggleApproval(u.user_id, u.approved)}
                          title={u.approved ? "Click to revoke access" : "Click to approve access"}
                        >
                          {u.approved ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          {u.approved ? "Approved" : "Pending"}
                        </Button>
                      </td>
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

        {/* Model Performance Metrics (Researchers & Experts) */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            Researchers & Experts — Model Performance
          </h2>
          <ModelMetrics
            totalScans={totalScans}
            freshCount={allScans.filter((s) => s.freshness_level === "fresh").length}
            moderateCount={allScans.filter((s) => s.freshness_level === "moderate").length}
            poorCount={allScans.filter((s) => s.freshness_level === "poor").length}
            avgFreshness={avgFreshnessAll}
            avgConfidence={totalScans > 0 ? Math.round(allScans.reduce((s, r) => s + Number(r.freshness_score ?? 0), 0) / totalScans) : 0}
            speciesCount={speciesData.length}
            locationCount={locationData.length}
          />
        </div>

        <EditLocationDialog
          open={editLocOpen}
          onOpenChange={setEditLocOpen}
          scanIds={allScans.filter((s) => !s.location_name).map((s) => s.id)}
          onSuccess={() => {
            invalidateScans();
            queryClient.invalidateQueries({ queryKey: ["adminScanLocations"] });
          }}
        />
      </main>
    </div>
  );
};

export default AdminPage;
