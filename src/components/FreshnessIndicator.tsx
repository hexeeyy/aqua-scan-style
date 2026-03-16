import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, XCircle, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface FreshnessIndicatorProps {
  level: "fresh" | "moderate" | "poor";
  score: number;
}

export const FreshnessIndicator = ({ level, score }: FreshnessIndicatorProps) => {
  const config = {
    fresh: {
      icon: CheckCircle2,
      shield: ShieldCheck,
      text: "Fresh",
      gradient: "bg-fresh-gradient",
      description: "Excellent quality for consumption",
      emoji: "🟢",
    },
    moderate: {
      icon: AlertCircle,
      shield: ShieldAlert,
      text: "Moderate",
      gradient: "bg-moderate-gradient",
      description: "Should be consumed soon",
      emoji: "🟡",
    },
    poor: {
      icon: XCircle,
      shield: ShieldX,
      text: "Poor",
      gradient: "bg-poor-gradient",
      description: "Not recommended for consumption",
      emoji: "🔴",
    }
  };

  const { icon: Icon, text, gradient, description, emoji } = config[level] ?? config.moderate;

  return (
    <Card className="border-none shadow-lg overflow-hidden hover-lift animate-scale-in">
      <div className={`${gradient} p-3 text-white relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
        <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-white/10" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold tracking-tight">{text}</h3>
                <span className="text-sm">{emoji}</span>
              </div>
              <p className="text-[10px] opacity-90 font-medium">{description}</p>
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wide uppercase opacity-90">Freshness Score</span>
              <span className="text-lg font-bold">{score}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden shadow-inner backdrop-blur-sm">
              <div 
                className="bg-white rounded-full h-2.5 transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
