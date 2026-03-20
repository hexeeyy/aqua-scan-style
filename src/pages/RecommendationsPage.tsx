import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, XCircle, ChefHat, ShieldAlert, TrendingDown, Eye, Thermometer, DollarSign, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultPanel } from "@/components/ResultPanel";
import type { MarketDuration, ConsumerRecommendation } from "@/components/MarketDurationCard";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { MockDataBanner } from "@/components/MockDataBanner";
import { MOCK_MARKET_DURATION, MOCK_CONSUMER_RECOMMENDATION } from "@/lib/mockScanData";

const verdictConfig = {
  buy: { icon: CheckCircle, label: "Safe to Buy", color: "text-success", bg: "bg-success/10 border-success/30", headerBg: "from-[hsl(145,65%,45%)] to-[hsl(160,70%,55%)]" },
  buy_with_caution: { icon: AlertTriangle, label: "Buy with Caution", color: "text-warning", bg: "bg-warning/10 border-warning/30", headerBg: "from-[hsl(45,95%,55%)] to-[hsl(35,95%,60%)]" },
  dont_buy: { icon: XCircle, label: "Don't Buy", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30", headerBg: "from-[hsl(0,85%,60%)] to-[hsl(15,85%,65%)]" },
};

const RecommendationsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isApproved, isLoading } = useApprovalStatus();

  const state = location.state as {
    marketDuration: MarketDuration;
    consumerRecommendation: ConsumerRecommendation;
    species?: string;
    freshnessLevel?: string;
    freshnessScore?: number;
    capturedImage?: string | null;
  } | null;

  const isMockMode = !isLoading && !isApproved && !state;

  const marketDuration: MarketDuration = state?.marketDuration ?? MOCK_MARKET_DURATION;
  const consumerRecommendation: ConsumerRecommendation = state?.consumerRecommendation ?? MOCK_CONSUMER_RECOMMENDATION;
  const species = state?.species ?? "Tilapia (Sample)";
  const capturedImage = state?.capturedImage ?? null;

  if (!state && isApproved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">No recommendation data available.</p>
          <Button onClick={() => navigate("/")} variant="ocean">Go Back</Button>
        </div>
      </div>
    );
  }

  const verdict = verdictConfig[consumerRecommendation.verdict];
  const VerdictIcon = verdict.icon;

  return (
    <div className="min-h-screen bg-background">
      <header className={`sticky top-0 z-10 border-b border-white/10 shadow-md backdrop-blur-xl bg-gradient-to-r ${verdict.headerBg}`}>
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl text-white hover:bg-white/20" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white tracking-tight">Consumer Guide</h1>
            {species && <p className="text-white/80 text-[10px] font-medium">{species}</p>}
          </div>
          {capturedImage && (
            <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-white/30">
              <img src={capturedImage} alt="Fish" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-24 space-y-3">
        {isMockMode && <MockDataBanner />}

        {/* Verdict Hero */}
        <div className={`rounded-2xl border-2 ${verdict.bg} p-5 text-center animate-scale-in`}>
          <VerdictIcon className={`w-12 h-12 ${verdict.color} mx-auto mb-2`} />
          <h2 className={`text-2xl font-bold ${verdict.color} mb-1`}>{verdict.label}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">{consumerRecommendation.verdictReason}</p>
        </div>

        {/* Market Duration Detail */}
        <ResultPanel title="Time on Display" icon={Clock} variant="primary">
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">~{marketDuration.estimatedHours}h</span>
              <span className="text-xs text-muted-foreground">estimated on display</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Thermometer className="w-3 h-3" />
              <span>{marketDuration.displayCondition}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Visual Indicators
              </p>
              <div className="flex flex-wrap gap-1.5">
                {marketDuration.visualCues.map((cue, i) => (
                  <span key={i} className="px-2.5 py-1 bg-muted/50 text-[10px] text-foreground rounded-full border border-border/30 font-medium">
                    {cue}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground/70">
              Confidence: {marketDuration.confidence} • Based on AI visual analysis
            </p>
          </div>
        </ResultPanel>

        {/* Price Fairness */}
        <ResultPanel title="Price Assessment" icon={DollarSign} variant={consumerRecommendation.priceFairness.isFair ? "success" : "warning"}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {consumerRecommendation.priceFairness.isFair ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : (
                <TrendingDown className="w-5 h-5 text-warning" />
              )}
              <span className="text-sm font-bold text-foreground">
                {consumerRecommendation.priceFairness.isFair ? "Price is Fair" : "Price May Be Too High"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{consumerRecommendation.priceFairness.reason}</p>
            <div className="bg-muted/30 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground mb-0.5">Recommended fair price range</p>
              <p className="text-lg font-bold text-primary">
                ₱{consumerRecommendation.priceFairness.adjustedPriceMin.toLocaleString()} – ₱{consumerRecommendation.priceFairness.adjustedPriceMax.toLocaleString()}/kg
              </p>
            </div>
          </div>
        </ResultPanel>

        {/* Cooking Methods */}
        {consumerRecommendation.cookingMethods.length > 0 && (
          <ResultPanel title="Recommended Cooking" icon={UtensilsCrossed} variant="primary">
            <div className="grid grid-cols-2 gap-1.5">
              {consumerRecommendation.cookingMethods.map((method, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                  <ChefHat className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground">{method}</span>
                </div>
              ))}
            </div>
          </ResultPanel>
        )}

        {/* Handling Tips */}
        {consumerRecommendation.handlingTips.length > 0 && (
          <ResultPanel title="Handling & Storage Tips" icon={ShieldAlert} variant="info">
            <ul className="space-y-1.5">
              {consumerRecommendation.handlingTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </ResultPanel>
        )}

        {/* Safety Warnings */}
        {consumerRecommendation.safetyWarnings.length > 0 && (
          <ResultPanel title="Safety Warnings" icon={ShieldAlert} variant="danger">
            <ul className="space-y-1.5">
              {consumerRecommendation.safetyWarnings.map((warning, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </ResultPanel>
        )}
      </main>
    </div>
  );
};

export default RecommendationsPage;
