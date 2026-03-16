import { useState } from "react";
import { ArrowLeft, Trash2, Download, GitCompare, Calendar, Fish, X, Clock, Snowflake, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line, Area, AreaChart } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useScanHistory, useIsAdmin, useInvalidateScans } from "@/hooks/useScanData";

type FreshnessLevel = "fresh" | "moderate" | "poor";

export interface ScanRecord {
  id: string;
  timestamp: number;
  thumbnail: string;
  species: {
    name: string;
    scientificName: string;
    confidence: number;
  };
  freshness: {
    level: FreshnessLevel;
    score: number;
    reasoning: string;
  };
  pricePerKilo?: {
    min: number;
    max: number;
    currency: string;
    source?: string;
  };
  nutritionalInfo?: {
    protein: number;
    omega3: string;
    calories: number;
  };
  stats?: {
    eyeClarity: string;
    gillColor: string;
    texture: string;
  };
  spoilagePrediction?: {
    hoursAtRoomTemp: number;
    storage: Array<{ method: string; shelfLife: string; tempRange: string }>;
    riskLevel: string;
    recommendation: string;
  };
}

interface ScanHistoryProps {
  onBack: () => void;
}

import { getScansFromDb, getAllScansForAdmin, deleteScanFromDb } from "@/lib/scanHistoryDb";
import type { ScanRecordWithUser } from "@/lib/scanHistoryDb";

// Keep legacy helpers for backward compat
const STORAGE_KEY = "fishbuddy_scan_history";

export const getScanHistory = (): ScanRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveScanToHistory = (record: ScanRecord) => {
  const history = getScanHistory();
  history.unshift(record);
  if (history.length > 50) history.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const deleteScanFromHistory = (id: string) => {
  const history = getScanHistory().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

const freshnessColor = (level: FreshnessLevel) => {
  switch (level) {
    case "fresh": return "text-success";
    case "moderate": return "text-warning";
    case "poor": return "text-destructive";
  }
};

const freshnessBg = (level: FreshnessLevel) => {
  switch (level) {
    case "fresh": return "bg-success/10 border-success/30";
    case "moderate": return "bg-warning/10 border-warning/30";
    case "poor": return "bg-destructive/10 border-destructive/30";
  }
};

export const ScanHistory = ({ onBack }: ScanHistoryProps) => {
  const { user } = useAuth();
  const { data: scanData, isLoading: loadingDb } = useScanHistory();
  const { data: isAdmin = false } = useIsAdmin();
  const invalidateScans = useInvalidateScans();
  const history = scanData ?? [];
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await deleteScanFromDb(id);
    invalidateScans();
    setCompareIds((prev) => prev.filter((cid) => cid !== id));
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleExport = (record: ScanRecord) => {
    const data = {
      species: record.species.name,
      scientificName: record.species.scientificName,
      confidence: record.species.confidence,
      freshnessLevel: record.freshness.level,
      freshnessScore: record.freshness.score,
      reasoning: record.freshness.reasoning,
      price: record.pricePerKilo ? `₱${record.pricePerKilo.min}-₱${record.pricePerKilo.max}/kg` : "N/A",
      date: new Date(record.timestamp).toLocaleString(),
      nutrition: record.nutritionalInfo,
      qualityIndicators: record.stats,
      spoilagePrediction: record.spoilagePrediction ? {
        hoursAtRoomTemp: record.spoilagePrediction.hoursAtRoomTemp,
        riskLevel: record.spoilagePrediction.riskLevel,
        storage: record.spoilagePrediction.storage,
        recommendation: record.spoilagePrediction.recommendation,
      } : undefined,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fishbuddy-${record.species.name.toLowerCase().replace(/\s/g, "-")}-${new Date(record.timestamp).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fishbuddy-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const compareRecords = history.filter((r) => compareIds.includes(r.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 shadow-md backdrop-blur-xl" style={{ background: 'linear-gradient(135deg, hsl(204, 100%, 61%) 0%, hsl(214, 100%, 50%) 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl text-white hover:bg-white/20" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-white tracking-tight">Scan History</h1>
          </div>
          <div className="flex gap-2">
            {compareIds.length >= 2 && (
              <Button variant="secondary" size="sm" className="rounded-xl text-xs bg-white/20 text-white border-none hover:bg-white/30" onClick={() => setShowCompare(true)}>
                <GitCompare className="w-4 h-4 mr-1" />
                Compare ({compareIds.length})
              </Button>
            )}
            {history.length > 0 && (
              <Button variant="secondary" size="sm" className="rounded-xl text-xs bg-white/20 text-white border-none hover:bg-white/30" onClick={handleExportAll}>
                <Download className="w-4 h-4 mr-1" />
                Export All
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 pb-24">
        {history.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <Fish className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">No Scans Yet</h2>
            <p className="text-muted-foreground text-sm">Your scan history will appear here after your first analysis.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground font-medium">
              {history.length} scan{history.length !== 1 ? "s" : ""} {isAdmin ? "• All Users (Admin View)" : "• Tap to select for comparison (max 3)"}
            </p>

            {/* Freshness Trend Chart */}
            {history.length >= 2 && (() => {
              const chartData = [...history].reverse().map((r) => ({
                date: new Date(r.timestamp).toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
                species: r.species.name.split(" ")[0],
                freshness: r.freshness.score,
                confidence: r.species.confidence,
                spoilageHours: r.spoilagePrediction?.hoursAtRoomTemp ?? null,
              }));
              const minChartWidth = Math.max(600, chartData.length * 28);
              return (
                <div className="glass-effect rounded-2xl border border-border/50 p-4 shadow-md animate-fade-in">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                      <Fish className="w-3 h-3 text-primary" />
                    </div>
                    Freshness Trend
                    <span className="text-[10px] text-muted-foreground font-normal ml-auto">← Scroll →</span>
                  </h3>
                  <div className="h-52 overflow-x-auto overflow-y-hidden scrollbar-thin">
                    <div style={{ minWidth: minChartWidth, height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                          <defs>
                            <linearGradient id="freshnessGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="spoilageGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={40} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              fontSize: 11, borderRadius: 12,
                              border: "1px solid hsl(var(--border))",
                              background: "hsl(var(--card))",
                              boxShadow: "0 4px 12px hsl(var(--foreground) / 0.1)",
                            }}
                            formatter={(value: number, name: string) => {
                              if (name === "freshness") return [`${value}%`, "Freshness"];
                              if (name === "spoilageHours") return [value !== null ? `${value}h` : "N/A", "Room Temp Safe"];
                              return [value, name];
                            }}
                            labelFormatter={(label, payload) => {
                              const item = payload?.[0]?.payload;
                              return item ? `${label} — ${item.species}` : label;
                            }}
                          />
                          <Area type="monotone" dataKey="freshness" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#freshnessGradient)" dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }} activeDot={{ r: 6, strokeWidth: 2 }} />
                          <Area type="monotone" dataKey="spoilageHours" stroke="hsl(var(--warning))" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#spoilageGradient)" dot={{ r: 3, fill: "hsl(var(--warning))", strokeWidth: 1.5, stroke: "hsl(var(--background))" }} connectNulls />
                          <Legend formatter={(value) => value === "freshness" ? "Freshness %" : value === "spoilageHours" ? "Room Temp (h)" : value} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              );
            })()}
            {history.map((record, index) => (
              <div
                key={record.id}
                className={`glass-effect rounded-2xl border shadow-md overflow-hidden animate-fade-in transition-all duration-300 ${
                  compareIds.includes(record.id) ? "border-primary ring-2 ring-primary/20" : "border-border/50"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div
                    className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer border border-border/30"
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  >
                    <img src={record.thumbnail} alt={record.species.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-foreground text-sm truncate">{record.species.name}</h3>
                        <p className="text-xs text-muted-foreground italic">{record.species.scientificName}</p>
                        {isAdmin && (record as ScanRecordWithUser).userName && (
                          <p className="text-[10px] text-primary font-medium flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" />
                            {(record as ScanRecordWithUser).userName || (record as ScanRecordWithUser).userEmail}
                          </p>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${freshnessBg(record.freshness.level)}`}>
                        <span className={freshnessColor(record.freshness.level)}>
                          {record.freshness.score}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(record.timestamp).toLocaleDateString("en-PH", {
                          month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                      <span>{record.species.confidence}% match</span>
                    </div>

                    {record.pricePerKilo && (
                      <p className="text-xs font-semibold text-primary mt-1">
                        ₱{record.pricePerKilo.min.toLocaleString()} - ₱{record.pricePerKilo.max.toLocaleString()}/kg
                      </p>
                    )}

                    {record.spoilagePrediction && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-xs font-semibold ${
                          record.spoilagePrediction.riskLevel === "low" ? "text-success" :
                          record.spoilagePrediction.riskLevel === "moderate" ? "text-warning" : "text-destructive"
                        }`}>
                          {record.spoilagePrediction.hoursAtRoomTemp > 0
                            ? `~${record.spoilagePrediction.hoursAtRoomTemp}h at room temp`
                            : "Unsafe"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === record.id && (
                  <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/30 mt-0 animate-fade-in">
                    <p className="text-xs text-muted-foreground leading-relaxed pt-3">{record.freshness.reasoning}</p>
                    {record.stats && (
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(record.stats).map(([key, val]) => (
                          <div key={key} className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                            <p className="text-xs font-semibold text-foreground">{val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {record.spoilagePrediction && (
                      <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Spoilage Prediction
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {record.spoilagePrediction.storage.map((s, i) => (
                            <div key={i} className="bg-background/50 rounded-lg p-2 text-center">
                              <Snowflake className="w-3 h-3 text-primary/60 mx-auto mb-0.5" />
                              <p className="text-[10px] text-muted-foreground">{s.method}</p>
                              <p className="text-xs font-bold text-foreground">{s.shelfLife}</p>
                              <p className="text-[8px] text-muted-foreground">{s.tempRange}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{record.spoilagePrediction.recommendation}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex border-t border-border/30">
                  <button
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                      compareIds.includes(record.id) ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => toggleCompare(record.id)}
                  >
                    <GitCompare className="w-3.5 h-3.5 inline mr-1" />
                    {compareIds.includes(record.id) ? "Selected" : "Compare"}
                  </button>
                  <button
                    className="flex-1 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-l border-r border-border/30"
                    onClick={() => handleExport(record)}
                  >
                    <Download className="w-3.5 h-3.5 inline mr-1" />
                    Export
                  </button>
                  {(isAdmin || (record as ScanRecordWithUser).scanUserId === user?.id) && (
                    <button
                      className="flex-1 py-2.5 text-xs font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-colors"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compare Modal */}
        {showCompare && compareRecords.length >= 2 && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={() => setShowCompare(false)}>
            <div
              className="bg-background rounded-t-3xl md:rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Comparison</h2>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setShowCompare(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Side by side thumbnails */}
              <div className={`grid gap-3 mb-6 ${compareRecords.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {compareRecords.map((r) => (
                  <div key={r.id} className="text-center">
                    <div className="rounded-xl overflow-hidden border border-border/30 mb-2 aspect-square">
                      <img src={r.thumbnail} alt={r.species.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm font-bold text-foreground">{r.species.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.timestamp).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>

              {/* Freshness comparison chart */}
              <div className="glass-effect rounded-2xl p-5 border border-border/50 mb-4">
                <h3 className="text-sm font-bold text-foreground mb-3">Freshness Score Comparison</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareRecords.map((r) => ({
                      name: r.species.name.split(" ")[0],
                      score: r.freshness.score,
                      confidence: r.species.confidence,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" name="Freshness" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="confidence" name="Confidence" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Comparison table */}
              <div className="glass-effect rounded-2xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/30">
                      <th className="text-left p-3 text-xs text-muted-foreground font-semibold">Metric</th>
                      {compareRecords.map((r) => (
                        <th key={r.id} className="text-center p-3 text-xs text-muted-foreground font-semibold">{r.species.name.split(" ")[0]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/20">
                      <td className="p-3 text-xs text-muted-foreground">Freshness</td>
                      {compareRecords.map((r) => (
                        <td key={r.id} className={`p-3 text-center text-xs font-bold ${freshnessColor(r.freshness.level)}`}>
                          {r.freshness.level} ({r.freshness.score}%)
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/20">
                      <td className="p-3 text-xs text-muted-foreground">Confidence</td>
                      {compareRecords.map((r) => (
                        <td key={r.id} className="p-3 text-center text-xs font-bold text-primary">{r.species.confidence}%</td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/20">
                      <td className="p-3 text-xs text-muted-foreground">Price/kg</td>
                      {compareRecords.map((r) => (
                        <td key={r.id} className="p-3 text-center text-xs font-bold text-foreground">
                          {r.pricePerKilo ? `₱${r.pricePerKilo.min}-${r.pricePerKilo.max}` : "N/A"}
                        </td>
                      ))}
                    </tr>
                    {compareRecords.some((r) => r.nutritionalInfo) && (
                      <>
                        <tr className="border-b border-border/20">
                          <td className="p-3 text-xs text-muted-foreground">Protein</td>
                          {compareRecords.map((r) => (
                            <td key={r.id} className="p-3 text-center text-xs font-bold text-foreground">
                              {r.nutritionalInfo?.protein ?? "—"}g
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-3 text-xs text-muted-foreground">Calories</td>
                          {compareRecords.map((r) => (
                            <td key={r.id} className="p-3 text-center text-xs font-bold text-foreground">
                              {r.nutritionalInfo?.calories ?? "—"} kcal
                            </td>
                          ))}
                        </tr>
                      </>
                    )}
                    {compareRecords.some((r) => r.spoilagePrediction) && (
                      <tr>
                        <td className="p-3 text-xs text-muted-foreground">Room Temp Safe</td>
                        {compareRecords.map((r) => (
                          <td key={r.id} className={`p-3 text-center text-xs font-bold ${
                            r.spoilagePrediction?.riskLevel === "low" ? "text-success" :
                            r.spoilagePrediction?.riskLevel === "moderate" ? "text-warning" : "text-destructive"
                          }`}>
                            {r.spoilagePrediction ? `${r.spoilagePrediction.hoursAtRoomTemp}h` : "—"}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
