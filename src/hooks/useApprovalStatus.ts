import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_SCAN_LIMIT = 10;

export const useApprovalStatus = () => {
  const { user } = useAuth();

  const { data: isApproved, isLoading: approvalLoading } = useQuery({
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

  const { data: scanCount, isLoading: countLoading } = useQuery({
    queryKey: ["scanCount", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("scan_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 10_000,
  });

  const approved = isApproved ?? false;
  const scans = scanCount ?? 0;
  const freeScansRemaining = Math.max(0, FREE_SCAN_LIMIT - scans);
  const canScan = approved || freeScansRemaining > 0;

  return {
    isApproved: approved,
    isLoading: approvalLoading || countLoading,
    scanCount: scans,
    freeScansRemaining,
    freeScanLimit: FREE_SCAN_LIMIT,
    canScan,
  };
};
