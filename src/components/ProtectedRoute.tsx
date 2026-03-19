import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Fish } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Fish className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
