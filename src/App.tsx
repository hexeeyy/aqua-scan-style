import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRealtimeScans } from "@/hooks/useScanData";
import Index from "./pages/Index";
import About from "./pages/About";
import HistoryPage from "./pages/HistoryPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import AdminPage from "./pages/AdminPage";
import AreaDashboard from "./pages/AreaDashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PublicScanPage from "./pages/PublicScanPage";

const queryClient = new QueryClient();

const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  useRealtimeScans();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <RealtimeProvider>
          <BrowserRouter>
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
          </BrowserRouter>
        </RealtimeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
