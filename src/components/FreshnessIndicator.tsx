import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface FreshnessIndicatorProps {
  level: "fresh" | "moderate" | "poor";
  score: number;
}

export const FreshnessIndicator = ({ level, score }: FreshnessIndicatorProps) => {
  const config = {
    fresh: {
      icon: CheckCircle2,
      text: "Fresh",
      gradient: "bg-fresh-gradient",
      description: "Excellent quality for consumption"
    },
    moderate: {
      icon: AlertCircle,
      text: "Moderate",
      gradient: "bg-moderate-gradient",
      description: "Should be consumed soon"
    },
    poor: {
      icon: XCircle,
      text: "Poor",
      gradient: "bg-poor-gradient",
      description: "Not recommended for consumption"
    }
  };

  const { icon: Icon, text, gradient, description } = config[level];

  return (
    <Card className="border-none shadow-lg overflow-hidden hover-lift animate-scale-in">
      <div className={`${gradient} p-3 text-white relative overflow-hidden`}>
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">{text}</h3>
              <p className="text-[11px] opacity-95 font-medium">{description}</p>
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wide uppercase opacity-90">Freshness Score</span>
              <span className="text-base font-bold">{score}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden shadow-inner backdrop-blur-sm">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
