import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRealtimeScans } from "@/hooks/useScanData";
import { useCapacityGuard } from "@/hooks/useCapacityGuard";
import { CapacityWarning } from "@/components/CapacityWarning";
import { Fish } from "lucide-react";

// Lazy-load all page components to reduce initial bundle
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const RecommendationsPage = lazy(() => import("./pages/RecommendationsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AreaDashboard = lazy(() => import("./pages/AreaDashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicScanPage = lazy(() => import("./pages/PublicScanPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Fish className="w-8 h-8 text-primary animate-pulse" />
  </div>
);

const queryClient = new QueryClient();

const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  useRealtimeScans();
  return <>{children}</>;
};

const CapacityGuardedApp = () => {
  const { isOverCapacity, activeCount, maxUsers } = useCapacityGuard();

  return (
    <>
      {isOverCapacity && (
        <CapacityWarning activeCount={activeCount} maxUsers={maxUsers} />
      )}
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/area" element={<ProtectedRoute><AreaDashboard /></ProtectedRoute>} />
            <Route path="/scan/share/:token" element={<PublicScanPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <RealtimeProvider>
          <CapacityGuardedApp />
        </RealtimeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
