import { Card } from "@/components/ui/card";
import { Activity, Clock, Thermometer } from "lucide-react";

interface QuickStatsProps {
  stats: {
    eyeClarity: string;
    gillColor: string;
    texture: string;
  };
}

export const QuickStats = ({ stats }: QuickStatsProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="p-4 border-none shadow-sm text-center">
        <Activity className="w-5 h-5 text-primary mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-1">Eye Clarity</p>
        <p className="text-sm font-semibold text-foreground">{stats.eyeClarity}</p>
      </Card>
      <Card className="p-4 border-none shadow-sm text-center">
        <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-1">Gill Color</p>
        <p className="text-sm font-semibold text-foreground">{stats.gillColor}</p>
      </Card>
      <Card className="p-4 border-none shadow-sm text-center">
        <Thermometer className="w-5 h-5 text-primary mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-1">Texture</p>
        <p className="text-sm font-semibold text-foreground">{stats.texture}</p>
      </Card>
    </div>
  );
};
