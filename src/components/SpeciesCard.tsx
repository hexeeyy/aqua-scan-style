import { Card } from "@/components/ui/card";
import { Fish } from "lucide-react";

interface SpeciesCardProps {
  name: string;
  scientificName: string;
  confidence: number;
}

export const SpeciesCard = ({ name, scientificName, confidence }: SpeciesCardProps) => {
  return (
    <Card className="p-6 border-none shadow-md">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Fish className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground italic mb-3">{scientificName}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-semibold text-foreground">{confidence}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-ocean-gradient rounded-full h-2 transition-all duration-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
