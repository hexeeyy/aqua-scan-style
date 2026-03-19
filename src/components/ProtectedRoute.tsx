import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Fish, ShieldAlert, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, user, loading, signOut } = useAuth();

  const { data: approvalStatus, isLoading: approvalLoading } = useQuery({
    queryKey: ["approvalStatus", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("approved")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data?.approved ?? false;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  if (loading || (session && approvalLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Fish className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (approvalStatus === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          {/* Animated shield icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <ShieldAlert className="w-9 h-9 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Access Pending
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account is awaiting administrator approval. You'll be granted access once an admin reviews your request.
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-muted/50 border border-border/30 mx-auto max-w-xs">
            <Clock className="w-4 h-4 text-warning animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground">
              Verification in progress
            </span>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={signOut}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground/60">
            Signed in as {user?.email}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
