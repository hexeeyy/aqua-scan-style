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
      text: "Fresh na fresh!",
      gradient: "bg-fresh-gradient",
      description: "Excellent quality for consumption"
    },
    moderate: {
      icon: AlertCircle,
      text: "Goods pa yan tol, medj",
      gradient: "bg-moderate-gradient",
      description: "Should be consumed soon"
    },
    poor: {
      icon: XCircle,
      text: "bulok na",
      gradient: "bg-poor-gradient",
      description: "Not recommended for consumption"
    }
  };

  const { icon: Icon, text, gradient, description } = config[level];

  return (
    <Card className="border-none shadow-lg overflow-hidden hover-lift animate-scale-in">
      <div className={`${gradient} p-7 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">{text}</h3>
              <p className="text-sm opacity-95 font-medium mt-0.5">{description}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide uppercase opacity-90">Freshness Score</span>
              <span className="text-2xl font-bold">{score}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden shadow-inner backdrop-blur-sm">
              <div 
                className="bg-white rounded-full h-3 transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
