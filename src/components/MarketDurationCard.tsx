import { useState } from "react";
import { Clock, AlertTriangle, CheckCircle, XCircle, ChefHat, ShieldAlert, TrendingDown, Edit3 } from "lucide-react";
import { ResultPanel } from "./ResultPanel";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export interface MarketDuration {
  estimatedHours: number;
  confidence: string;
  visualCues: string[];
  displayCondition: string;
}

export interface ConsumerRecommendation {
  verdict: "buy" | "buy_with_caution" | "dont_buy";
  verdictReason: string;
  priceFairness: {
    isFair: boolean;
    adjustedPriceMin: number;
    adjustedPriceMax: number;
    reason: string;
  };
  handlingTips: string[];
  cookingMethods: string[];
  safetyWarnings: string[];
}

interface MarketDurationCardProps {
  marketDuration: MarketDuration;
  consumerRecommendation: ConsumerRecommendation;
  onViewDetails: () => void;
}

const verdictConfig = {
  buy: {
    icon: CheckCircle,
    label: "Safe to Buy",
    color: "text-success",
    bg: "bg-success/10 border-success/30",
    variant: "success" as const,
  },
  buy_with_caution: {
    icon: AlertTriangle,
    label: "Buy with Caution",
    color: "text-warning",
    bg: "bg-warning/10 border-warning/30",
    variant: "warning" as const,
  },
  dont_buy: {
    icon: XCircle,
    label: "Don't Buy",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
    variant: "danger" as const,
  },
};

export const MarketDurationCard = ({
  marketDuration,
  consumerRecommendation,
  onViewDetails,
}: MarketDurationCardProps) => {
  const [manualHours, setManualHours] = useState<string>("");
  const [useManual, setUseManual] = useState(false);

  const displayHours = useManual && manualHours ? parseFloat(manualHours) : marketDuration.estimatedHours;
  const verdict = verdictConfig[consumerRecommendation.verdict];
  const VerdictIcon = verdict.icon;

  return (
    <ResultPanel
      title="Market Duration & Advice"
      icon={Clock}
      variant={verdict.variant}
      className="gsap-result"
      footer={
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-[10px] text-primary font-semibold hover:bg-primary/5"
          onClick={onViewDetails}
        >
          View Full Recommendations →
        </Button>
      }
    >
      <div className="space-y-2.5">
        {/* Duration estimate */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Est. Time on Display</p>
            <p className="text-2xl font-bold text-foreground">
              ~{displayHours}h
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border ${verdict.bg} flex items-center gap-1.5`}>
            <VerdictIcon className={`w-4 h-4 ${verdict.color}`} />
            <span className={`text-xs font-bold ${verdict.color}`}>{verdict.label}</span>
          </div>
        </div>

        {/* Manual override */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setUseManual(!useManual)}
          >
            <Edit3 className="w-3 h-3" />
            {useManual ? "Use AI estimate" : "I know the actual time"}
          </button>
          {useManual && (
            <Input
              type="number"
              placeholder="Hours"
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
              className="w-20 h-6 text-[10px] px-2"
              min={0}
              max={72}
              step={0.5}
            />
          )}
        </div>

        {/* Visual cues */}
        <div className="flex flex-wrap gap-1">
          {marketDuration.visualCues.slice(0, 3).map((cue, i) => (
            <span key={i} className="px-2 py-0.5 bg-muted/50 text-[9px] text-muted-foreground rounded-full border border-border/30">
              {cue}
            </span>
          ))}
        </div>

        {/* Quick recommendation */}
        <p className="text-[10px] text-muted-foreground leading-relaxed bg-muted/30 rounded-lg px-2 py-1.5">
          {consumerRecommendation.verdictReason}
        </p>

        {/* Price fairness indicator */}
        {!consumerRecommendation.priceFairness.isFair && (
          <div className="flex items-center gap-1.5 text-[10px] text-warning bg-warning/5 rounded-lg px-2 py-1.5 border border-warning/20">
            <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Fair price: ₱{consumerRecommendation.priceFairness.adjustedPriceMin}–₱{consumerRecommendation.priceFairness.adjustedPriceMax}/kg</span>
          </div>
        )}

        {/* Top cooking suggestion */}
        {consumerRecommendation.cookingMethods.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ChefHat className="w-3 h-3 text-primary/70" />
            <span>Best as: {consumerRecommendation.cookingMethods.slice(0, 2).join(", ")}</span>
          </div>
        )}

        {/* Safety warnings */}
        {consumerRecommendation.safetyWarnings.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-2 py-1.5 space-y-0.5">
            {consumerRecommendation.safetyWarnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-destructive">
                <ShieldAlert className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ResultPanel>
  );
};
