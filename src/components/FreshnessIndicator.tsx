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
      text: "Not Fresh",
      gradient: "bg-poor-gradient",
      description: "Not recommended for consumption"
    }
  };

  const { icon: Icon, text, gradient, description } = config[level];

  return (
    <Card className="border-none shadow-md overflow-hidden">
      <div className={`${gradient} p-6 text-white`}>
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-8 h-8" />
          <div>
            <h3 className="text-2xl font-bold">{text}</h3>
            <p className="text-sm opacity-90">{description}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Freshness Score</span>
            <span className="text-lg font-bold">{score}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
