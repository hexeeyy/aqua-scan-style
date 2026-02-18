import { Card } from "@/components/ui/card";
import { Eye, Wind, Layers } from "lucide-react";

interface QuickStatsProps {
  stats: {
    eyeClarity: string;
    gillColor: string;
    texture: string;
  };
}

const statConfig = [
  { key: "eyeClarity" as const, label: "Eye Clarity", icon: Eye },
  { key: "gillColor" as const, label: "Gill Color", icon: Wind },
  { key: "texture" as const, label: "Texture", icon: Layers },
];

export const QuickStats = ({ stats }: QuickStatsProps) => {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {statConfig.map(({ key, label, icon: Icon }) => (
        <Card key={key} className="p-2.5 border-none shadow-md text-center hover-lift glass-effect group overflow-hidden relative">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <p className="text-[9px] text-muted-foreground mb-0.5 font-semibold uppercase tracking-widest">{label}</p>
          <p className="text-xs font-bold text-foreground">{stats[key]}</p>
        </Card>
      ))}
    </div>
  );
};
