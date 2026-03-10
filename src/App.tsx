import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import HealthCenterServices from "@/pages/HealthCenterServices";
import SanitationPermit from "@/pages/SanitationPermit";
import ImmunizationTracker from "@/pages/ImmunizationTracker";
import WastewaterServices from "@/pages/WastewaterServices";
import HealthSurveillance from "@/pages/HealthSurveillance";
import ResidentQR from "@/pages/ResidentQR";
import ResidentHealth from "@/pages/ResidentHealth";
import ResidentPermits from "@/pages/ResidentPermits";
import ResidentComplaints from "@/pages/ResidentComplaints";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/health-center" element={<HealthCenterServices />} />
              <Route path="/sanitation-permit" element={<SanitationPermit />} />
              <Route path="/immunization" element={<ImmunizationTracker />} />
              <Route path="/wastewater" element={<WastewaterServices />} />
              <Route path="/surveillance" element={<HealthSurveillance />} />
              <Route path="/my-qr" element={<ResidentQR />} />
              <Route path="/my-health" element={<ResidentHealth />} />
              <Route path="/my-permits" element={<ResidentPermits />} />
              <Route path="/my-complaints" element={<ResidentComplaints />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
