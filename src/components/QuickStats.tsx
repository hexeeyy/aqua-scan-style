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
    <div className="grid grid-cols-3 gap-1.5">
      <Card className="p-2 border-none shadow-md text-center hover-lift glass-effect group">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
          <Activity className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Eye</p>
        <p className="text-xs font-bold text-foreground">{stats.eyeClarity}</p>
      </Card>
      <Card className="p-2 border-none shadow-md text-center hover-lift glass-effect group">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Gills</p>
        <p className="text-xs font-bold text-foreground">{stats.gillColor}</p>
      </Card>
      <Card className="p-2 border-none shadow-md text-center hover-lift glass-effect group">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
          <Thermometer className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Texture</p>
        <p className="text-xs font-bold text-foreground">{stats.texture}</p>
      </Card>
    </div>
  );
};
