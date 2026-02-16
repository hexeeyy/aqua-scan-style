import { Card } from "@/components/ui/card";
import { Fish, Fingerprint, TrendingUp } from "lucide-react";

interface SpeciesCardProps {
  name: string;
  scientificName: string;
  confidence: number;
}

export const SpeciesCard = ({ name, scientificName, confidence }: SpeciesCardProps) => {
  const confidenceColor = confidence >= 80 ? 'text-success' : confidence >= 50 ? 'text-warning' : 'text-destructive';
  const barColor = confidence >= 80 ? 'bg-fresh-gradient' : confidence >= 50 ? 'bg-moderate-gradient' : 'bg-poor-gradient';

  return (
    <Card className="border-none shadow-lg overflow-hidden animate-scale-in bg-gradient-to-br from-card to-card/80">
      {/* Header strip */}
      <div className="bg-ocean-gradient px-3 py-2 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md">
          <Fish className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-primary-foreground tracking-tight truncate">{name}</h3>
          <p className="text-[10px] text-primary-foreground/70 italic truncate">{scientificName}</p>
        </div>
      </div>

      {/* Confidence section */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Fingerprint className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">AI Confidence</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className={`w-3 h-3 ${confidenceColor}`} />
            <span className={`text-lg font-bold ${confidenceColor}`}>{confidence}%</span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-inner">
          <div 
            className={`${barColor} rounded-full h-2.5 transition-all duration-1000 ease-out shadow-sm`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <p className="text-[9px] text-muted-foreground text-right font-medium">
          {confidence >= 80 ? "High certainty identification" : confidence >= 50 ? "Moderate certainty" : "Low certainty — verify manually"}
        </p>
      </div>
    </Card>
  );
};
