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
    <div className="grid grid-cols-3 gap-4">
      <Card className="p-5 border-none shadow-md text-center hover-lift glass-effect group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Eye Clarity</p>
        <p className="text-base font-bold text-foreground">{stats.eyeClarity}</p>
      </Card>
      <Card className="p-5 border-none shadow-md text-center hover-lift glass-effect group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Gill Color</p>
        <p className="text-base font-bold text-foreground">{stats.gillColor}</p>
      </Card>
      <Card className="p-5 border-none shadow-md text-center hover-lift glass-effect group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm">
          <Thermometer className="w-5 h-5 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Texture</p>
        <p className="text-base font-bold text-foreground">{stats.texture}</p>
      </Card>
    </div>
  );
};
