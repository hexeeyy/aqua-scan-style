import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useApprovalStatus = () => {
  const { user } = useAuth();

  const { data: isApproved, isLoading } = useQuery({
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

  return { isApproved: isApproved ?? false, isLoading };
};
