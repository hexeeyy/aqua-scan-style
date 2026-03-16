import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Fish, Thermometer, DollarSign, Apple, Eye, Clock, Snowflake, CheckCircle, AlertTriangle, XCircle, ChefHat, ShieldAlert, TrendingDown } from "lucide-react";
import { ResultPanel } from "@/components/ResultPanel";
import { FreshnessGauge } from "@/components/FreshnessGauge";
import { QuickStats } from "@/components/QuickStats";
import { SpoilageCountdown } from "@/components/SpoilageCountdown";
import type { MarketDuration, ConsumerRecommendation } from "@/components/MarketDurationCard";
import logoImage from "@/assets/logo.png";

type FreshnessLevel = "fresh" | "moderate" | "poor";

interface ScanData {
  species_name: string;
  scientific_name: string;
  confidence: number;
  freshness_level: FreshnessLevel;
  freshness_score: number;
  freshness_reasoning: string;
  eye_clarity: string;
  gill_color: string;
  texture: string;
  price_min: number | null;
  price_max: number | null;
  price_currency: string;
  nutritional_protein: number | null;
  nutritional_omega3: string | null;
  nutritional_calories: number | null;
  spoilage_hours_room_temp: number | null;
  spoilage_risk_level: string | null;
  spoilage_recommendation: string | null;
  spoilage_storage: any[] | null;
  thumbnail: string | null;
  created_at: string;
  market_duration: MarketDuration | null;
  consumer_recommendation: ConsumerRecommendation | null;
}

const verdictConfig = {
  buy: { icon: CheckCircle, label: "Safe to Buy", color: "text-success", bg: "bg-success/10 border-success/30" },
  buy_with_caution: { icon: AlertTriangle, label: "Not Recommended", color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  dont_buy: { icon: XCircle, label: "Don't Buy", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
};

const PublicScanPage = () => {
  const { token } = useParams<{ token: string }>();
  const [scan, setScan] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScan = async () => {
      if (!token) { setError("Invalid link"); setLoading(false); return; }
      const { data, error: dbError } = await supabase
        .from("scan_history")
        .select("*")
        .eq("share_token", token)
        .maybeSingle();

      if (dbError || !data) {
        setError("Scan not found or link expired.");
      } else {
        setScan(data as unknown as ScanData);
      }
      setLoading(false);
    };
    fetchScan();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Scan Not Found</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const cr = scan.consumer_recommendation;
  const md = scan.market_duration;
  const verdict = cr ? verdictConfig[cr.verdict] ?? verdictConfig.buy_with_caution : null;
  const VerdictIcon = verdict?.icon ?? AlertTriangle;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <img src={logoImage} alt="Logo" className="w-8 h-8 rounded-lg" />
        <div>
          <h1 className="text-sm font-bold text-foreground">Fish Freshness Report</h1>
          <p className="text-[10px] text-muted-foreground">AI-Powered Analysis • {new Date(scan.created_at).toLocaleDateString()}</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-3 py-4 space-y-3">
        {/* Verdict Banner */}
        {verdict && cr && (
          <div className={`rounded-xl border p-4 ${verdict.bg} flex items-center gap-3`}>
            <VerdictIcon className={`w-8 h-8 ${verdict.color}`} />
            <div>
              <p className={`text-lg font-bold ${verdict.color}`}>{verdict.label}</p>
              <p className="text-xs text-muted-foreground">{cr.verdictReason}</p>
            </div>
          </div>
        )}

        {/* Species + Thumbnail */}
        <ResultPanel title="Species Identified" icon={Fish} variant="primary">
          <div className="flex items-center gap-3">
            {scan.thumbnail && (
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-primary/30 flex-shrink-0">
                <img src={scan.thumbnail} alt="Scanned fish" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground truncate">{scan.species_name}</h4>
              <p className="text-[10px] text-muted-foreground italic">{scan.scientific_name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xl font-bold text-primary">{scan.confidence}%</span>
              <p className="text-[8px] text-muted-foreground font-semibold">CONFIDENCE</p>
            </div>
          </div>
        </ResultPanel>

        {/* Freshness */}
        <ResultPanel
          title="Freshness Score"
          icon={Thermometer}
          variant={scan.freshness_level === "fresh" ? "success" : scan.freshness_level === "moderate" ? "warning" : "danger"}
        >
          <div className="flex items-center gap-3">
            <FreshnessGauge score={scan.freshness_score} level={scan.freshness_level} size={80} />
            <div className="flex-1 space-y-1">
              <p className="text-xs font-bold text-foreground capitalize">{scan.freshness_level} Quality</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{scan.freshness_reasoning}</p>
            </div>
          </div>
        </ResultPanel>

        {/* Quality Indicators */}
        {scan.eye_clarity && (
          <ResultPanel title="Quality Indicators" icon={Eye} variant={scan.freshness_level === "fresh" ? "success" : scan.freshness_level === "moderate" ? "warning" : "danger"}>
            <QuickStats stats={{ eyeClarity: scan.eye_clarity, gillColor: scan.gill_color, texture: scan.texture }} />
          </ResultPanel>
        )}

        {/* Price */}
        {scan.price_min != null && (
          <ResultPanel title="Market Price (PH)" icon={DollarSign} variant="primary">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">₱{scan.price_min.toLocaleString()} - ₱{scan.price_max?.toLocaleString()}</span>
              <span className="text-muted-foreground font-semibold text-[10px]">per kg</span>
            </div>
          </ResultPanel>
        )}

        {/* Price Fairness */}
        {cr && !cr.priceFairness.isFair && (
          <div className="flex items-center gap-1.5 text-xs text-warning bg-warning/5 rounded-xl px-3 py-2 border border-warning/20">
            <TrendingDown className="w-4 h-4 flex-shrink-0" />
            <span>Fair price: ₱{cr.priceFairness.adjustedPriceMin}–₱{cr.priceFairness.adjustedPriceMax}/kg</span>
          </div>
        )}

        {/* Nutrition */}
        {scan.nutritional_protein != null && (
          <ResultPanel title="Nutrition (per 100g)" icon={Apple} variant="success">
            <div className="space-y-1.5">
              {[
                { label: "Protein", value: `${scan.nutritional_protein}g`, icon: "💪" },
                { label: "Omega-3", value: scan.nutritional_omega3 ?? "N/A", icon: "🐟" },
                { label: "Calories", value: `${scan.nutritional_calories} kcal`, icon: "🔥" },
              ].map((n, i) => (
                <div key={n.label} className={`flex justify-between items-center py-1.5 ${i < 2 ? 'border-b border-border/20' : ''}`}>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5"><span>{n.icon}</span>{n.label}</span>
                  <span className="text-sm font-bold text-foreground">{n.value}</span>
                </div>
              ))}
            </div>
          </ResultPanel>
        )}

        {/* Spoilage */}
        {scan.spoilage_hours_room_temp != null && (
          <ResultPanel
            title="Spoilage Prediction"
            icon={Clock}
            variant={scan.spoilage_risk_level === "low" ? "success" : scan.spoilage_risk_level === "moderate" ? "warning" : "danger"}
          >
            <div className="space-y-2">
              <SpoilageCountdown hoursAtRoomTemp={scan.spoilage_hours_room_temp} riskLevel={scan.spoilage_risk_level ?? "moderate"} />
              {scan.spoilage_storage && (
                <div className="space-y-1">
                  {(scan.spoilage_storage as any[]).map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-border/15 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <Snowflake className="w-2.5 h-2.5 text-primary/70" />
                        <span className="text-[10px] text-muted-foreground">{s.method}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-foreground">{s.shelfLife}</span>
                        <span className="text-[8px] text-muted-foreground ml-1">({s.tempRange})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {scan.spoilage_recommendation && (
                <p className="text-[9px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">{scan.spoilage_recommendation}</p>
              )}
            </div>
          </ResultPanel>
        )}

        {/* Cooking Methods */}
        {cr && cr.cookingMethods.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card rounded-xl px-3 py-2 border border-border/30">
            <ChefHat className="w-4 h-4 text-primary/70" />
            <span>Best cooked as: {cr.cookingMethods.join(", ")}</span>
          </div>
        )}

        {/* Safety Warnings */}
        {cr && cr.safetyWarnings.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2 space-y-1">
            {cr.safetyWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-destructive">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Handling Tips */}
        {cr && cr.handlingTips.length > 0 && (
          <ResultPanel title="Handling Tips" icon={ShieldAlert} variant="info">
            <ul className="space-y-1">
              {cr.handlingTips.map((tip, i) => (
                <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </ResultPanel>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground">Powered by SariOne AI Fish Analysis System</p>
          <p className="text-[9px] text-muted-foreground mt-1">This report was generated automatically. Results are for reference only.</p>
        </div>
      </main>
    </div>
  );
};

export default PublicScanPage;
