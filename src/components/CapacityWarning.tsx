import { Users, ShieldAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface CapacityWarningProps {
  activeCount: number;
  maxUsers: number;
}

export const CapacityWarning = ({ activeCount, maxUsers }: CapacityWarningProps) => {
  const { signOut } = useAuth();

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-5">
        {/* Animated icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-warning/10 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/20 flex items-center justify-center">
            <Users className="w-9 h-9 text-warning" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            High Traffic Detected
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The system is currently at capacity with <strong className="text-foreground">{activeCount}</strong> active users (limit: {maxUsers}). Please try again in a few minutes.
          </p>
        </div>

        {/* Live counter */}
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-muted/50 border border-border/30 mx-auto max-w-xs">
          <ShieldAlert className="w-4 h-4 text-warning" />
          <span className="text-xs font-semibold text-muted-foreground">
            {activeCount} / {maxUsers} users online
          </span>
          <Clock className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
        </div>

        <p className="text-[10px] text-muted-foreground/60">
          Approved users and administrators are not affected by this limit.
        </p>

        <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};
