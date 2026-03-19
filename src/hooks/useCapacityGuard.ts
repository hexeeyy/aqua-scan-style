import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { useQuery } from "@tanstack/react-query";

const MAX_CONCURRENT_USERS = 10;

export const useCapacityGuard = () => {
  const { user } = useAuth();
  const { isApproved } = useApprovalStatus();
  const [activeCount, setActiveCount] = useState(0);
  const [isOverCapacity, setIsOverCapacity] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Check if user has a privileged role (super_admin or admin)
  const { data: hasPrivilegedRole } = useQuery({
    queryKey: ["privilegedRole", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) return false;
      return data?.some((r) => r.role === "super_admin" || r.role === "admin") ?? false;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const isBypassed = isApproved || hasPrivilegedRole === true;

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("app-presence", {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setActiveCount(count);
        setIsOverCapacity(!isBypassed && count > MAX_CONCURRENT_USERS);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, joined_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user, isBypassed]);

  // Update over-capacity when bypass status changes
  useEffect(() => {
    if (isBypassed) {
      setIsOverCapacity(false);
    } else {
      setIsOverCapacity(activeCount > MAX_CONCURRENT_USERS);
    }
  }, [isBypassed, activeCount]);

  return {
    activeCount,
    isOverCapacity,
    maxUsers: MAX_CONCURRENT_USERS,
    isBypassed,
  };
};
