import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,
  });
};

export const useScanHistory = () => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  return useQuery<ScanRecordWithUser[]>({
    queryKey: ["scanHistory", user?.id, isAdmin],
    queryFn: () => (isAdmin ? getAllScansForAdmin() : getScansFromDb()),
    enabled: !!user && !adminLoading,
    staleTime: 2 * 60 * 1000, // 2 min cache
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev, // keep previous data while refetching
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

export const useInvalidateScans = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
    queryClient.invalidateQueries({ queryKey: ["areaScans"] });
  };
};
