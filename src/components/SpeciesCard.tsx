import { Card } from "@/components/ui/card";
import { Fish } from "lucide-react";

interface SpeciesCardProps {
  name: string;
  scientificName: string;
  confidence: number;
}

export const SpeciesCard = ({ name, scientificName, confidence }: SpeciesCardProps) => {
  return (
    <Card className="p-6 border-none shadow-md hover-lift glass-effect animate-fade-in overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Fish className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-foreground mb-1 tracking-tight">{name}</h3>
          <p className="text-sm text-muted-foreground italic mb-4 font-medium">{scientificName}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Confidence Level</span>
              <span className="font-bold text-foreground text-lg">{confidence}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-inner">
              <div 
                className="bg-ocean-gradient rounded-full h-2.5 transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
