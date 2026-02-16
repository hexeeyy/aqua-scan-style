import { useEffect, useState } from "react";

interface SpoilageCountdownProps {
  hoursAtRoomTemp: number;
  riskLevel: string;
  maxHours?: number;
}

export const SpoilageCountdown = ({ hoursAtRoomTemp, riskLevel, maxHours = 8 }: SpoilageCountdownProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const percentage = Math.min((hoursAtRoomTemp / maxHours) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  const colorClass = riskLevel === "low" ? "text-success" : riskLevel === "moderate" ? "text-warning" : "text-destructive";
  const strokeColor = riskLevel === "low" ? "hsl(var(--success))" : riskLevel === "moderate" ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const glowColor = riskLevel === "low" ? "hsl(var(--success) / 0.4)" : riskLevel === "moderate" ? "hsl(var(--warning) / 0.4)" : "hsl(var(--destructive) / 0.4)";

  return (
    <div className="flex items-center gap-3">
      {/* Circular countdown */}
      <div className="relative flex-shrink-0" style={{ width: 68, height: 68 }}>
        <svg width="68" height="68" className="-rotate-90">
          <circle
            cx="34" cy="34" r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="5"
          />
          <circle
            cx="34" cy="34" r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 4px ${glowColor})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-base font-bold leading-none ${colorClass}`}>
            {hoursAtRoomTemp > 0 ? hoursAtRoomTemp : 0}
          </span>
          <span className="text-[7px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
            {hoursAtRoomTemp > 0 ? "hours" : "unsafe"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div>
          <p className="text-[10px] text-muted-foreground font-medium">Room temp (~30°C)</p>
          <p className={`text-xs font-bold ${colorClass}`}>
            {hoursAtRoomTemp > 0
              ? `~${hoursAtRoomTemp}h remaining`
              : "Already unsafe"}
          </p>
        </div>
        {/* Mini progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${animatedProgress}%`,
              background: strokeColor,
              boxShadow: `0 0 6px ${glowColor}`,
            }}
          />
        </div>
        <p className="text-[8px] text-muted-foreground">
          {riskLevel === "low" ? "Safe window" : riskLevel === "moderate" ? "Act soon" : "Immediate action needed"}
        </p>
      </div>
    </div>
  );
};
