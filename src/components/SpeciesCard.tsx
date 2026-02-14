import { Card } from "@/components/ui/card";
import { Fish } from "lucide-react";

interface SpeciesCardProps {
  name: string;
  scientificName: string;
  confidence: number;
}

export const SpeciesCard = ({ name, scientificName, confidence }: SpeciesCardProps) => {
  return (
    <Card className="p-3 border-none shadow-md hover-lift glass-effect animate-fade-in overflow-hidden relative">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Fish className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-foreground mb-0.5 tracking-tight">{name}</h3>
          <p className="text-[11px] text-muted-foreground italic mb-2 font-medium">{scientificName}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Confidence</span>
              <span className="font-bold text-foreground text-sm">{confidence}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden shadow-inner">
              <div 
                className="bg-ocean-gradient rounded-full h-2 transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
