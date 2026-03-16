import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getScansFromDb, getAllScansForAdmin } from "@/lib/scanHistoryDb";
import type { ScanRecordWithUser } from "@/lib/scanHistoryDb";

const checkAdmin = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  return (data?.length ?? 0) > 0;
};

export const useIsAdmin = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: () => checkAdmin(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useInvalidateScans = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
    queryClient.invalidateQueries({ queryKey: ["areaScans"] });
    queryClient.invalidateQueries({ queryKey: ["adminScans"] });
  };
};

/**
 * Single realtime subscription that invalidates all scan-related queries.
 * Mount this ONCE at a high level (e.g. App or layout) to avoid duplicate channels.
 */
export const useRealtimeScans = () => {
  const { user } = useAuth();
  const invalidate = useInvalidateScans();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("global-scans-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scan_history" },
        (payload) => {
          invalidate();
          const newScan = payload.new as {
            user_id?: string;
            species_name?: string | null;
            location_name?: string | null;
            freshness_level?: string | null;
          };
          if (newScan.user_id !== user.id) {
            const species = newScan.species_name || "Unknown species";
            const location = newScan.location_name || "Unknown location";
            const level = (newScan.freshness_level || "").toLowerCase();
            const variant = level === "fresh" ? "fresh" : level === "poor" ? "poor" : "moderate";
            const emoji = level === "fresh" ? "🟢" : level === "poor" ? "🔴" : "🟡";
            toast({
              title: `${emoji} New Scan Detected`,
              description: `${species} scanned at ${location}`,
              variant: variant as any,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scan_history" },
        () => { invalidate(); }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "scan_history" },
        () => { invalidate(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};

export const useScanHistory = () => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  return useQuery<ScanRecordWithUser[]>({
    queryKey: ["scanHistory", user?.id, isAdmin],
    queryFn: () => (isAdmin ? getAllScansForAdmin() : getScansFromDb()),
    enabled: !!user && !adminLoading,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
};

export const useAreaScans = () => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  return useQuery({
    queryKey: ["areaScans", user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("scan_history")
        .select("id, species_name, freshness_level, freshness_score, price_min, price_max, location_name, timestamp, user_id")
        .not("location_name", "is", null)
        .order("timestamp", { ascending: false })
        .limit(500);

      if (!isAdmin) {
        query = query.eq("user_id", user?.id ?? "");
      }

      const { data } = await query;
      return (data ?? []) as Array<{
        id: string;
        species_name: string | null;
        freshness_level: string | null;
        freshness_score: number | null;
        price_min: number | null;
        price_max: number | null;
        location_name: string | null;
        timestamp: number;
        user_id: string;
      }>;
    },
    enabled: !!user && !adminLoading,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
};
