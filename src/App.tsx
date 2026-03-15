import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import CitizenDashboard from "@/pages/CitizenDashboard";
import BhwDashboard from "@/pages/BhwDashboard";
import HealthCenterDashboard from "@/pages/staff/HealthCenterDashboard";
import InspectorDashboard from "@/pages/staff/InspectorDashboard";
import CityHealthOfficerDashboard from "@/pages/staff/CityHealthOfficerDashboard";
import LguAdminDashboard from "@/pages/staff/LguAdminDashboard";
import SystemAdminDashboard from "@/pages/staff/SystemAdminDashboard";
import HealthCenterServices from "@/pages/HealthCenterServices";
import SanitationPermit from "@/pages/SanitationPermit";
import ImmunizationTracker from "@/pages/ImmunizationTracker";
import WastewaterServices from "@/pages/WastewaterServices";
import HealthSurveillance from "@/pages/HealthSurveillance";
import CitizenAssistance from "@/pages/bhw/CitizenAssistance";
import BhwServiceRequests from "@/pages/bhw/ServiceRequests";
import BhwHealthPrograms from "@/pages/bhw/HealthPrograms";
import BhwVaccinationRequests from "@/pages/bhw/VaccinationRequests";
import BhwNutritionMonitoring from "@/pages/bhw/NutritionMonitoring";
import BhwCommunityReports from "@/pages/bhw/CommunityReports";
import BhwComplaints from "@/pages/bhw/Complaints";
import BhwBarangayHealth from "@/pages/bhw/BarangayHealth";
import StaffScanQr from "@/pages/staff/StaffScanQr";
import StaffRequests from "@/pages/staff/StaffRequests";
import StaffAssessments from "@/pages/staff/StaffAssessments";
import StaffPermitVerification from "@/pages/staff/StaffPermitVerification";
import StaffCitizenRegistration from "@/pages/staff/StaffCitizenRegistration";
import DiseaseMapDashboard from "@/pages/surveillance/DiseaseMapDashboard";
import LguRequests from "@/pages/lgu/LguRequests";
import LguVaccination from "@/pages/lgu/LguVaccination";
import LguSanitation from "@/pages/lgu/LguSanitation";
import LguAnalytics from "@/pages/lgu/LguAnalytics";
import SystemAdminUsers from "@/pages/sys/SystemAdminUsers";
import SystemAdminPlaceholder from "@/pages/sys/SystemAdminPlaceholder";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Citizen pages
import CitizenQR from "@/pages/citizen/CitizenQR";
import HealthServices from "@/pages/citizen/HealthServices";
import VaccinationNutrition from "@/pages/citizen/VaccinationNutrition";
import DiseaseReporting from "@/pages/citizen/DiseaseReporting";
import Complaints from "@/pages/citizen/Complaints";
import MyEstablishments from "@/pages/citizen/MyEstablishments";
import SanitaryPermitApplication from "@/pages/citizen/SanitaryPermitApplication";
import InspectionStatus from "@/pages/citizen/InspectionStatus";
import Certificates from "@/pages/citizen/Certificates";
import Payments from "@/pages/citizen/Payments";
import ServiceRequests from "@/pages/citizen/ServiceRequests";
import WaterwayCleanupReport from "@/pages/citizen/WaterwayCleanupReport";
import DesludgingScheduleViewer from "@/pages/citizen/DesludgingScheduleViewer";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  // If already authenticated, hand off to role-based router instead
  if (user) {
    return <RoleDashboard />;
  }

  return <>{children}</>;
};

const mapProfileRoleToPath = (role: string | null | undefined) => {
  switch (role) {
    case "citizen":
      return "/citizen/dashboard";
    case "bhw":
      return "/bhw/dashboard";
    case "sanitary_inspector":
      return "/inspector/dashboard";
    case "health_staff":
      return "/staff/dashboard";
    case "lgu_admin":
      return "/lgu/dashboard";
    case "city_health_officer":
      return "/health-officer/dashboard";
    case "system_admin":
      return "/admin/dashboard";
    default:
      return null;
  }
};

const getDashboardPath = (role: string | null | undefined) => {
  switch (role) {
    case "Citizen_User":
    case "BusinessOwner_User":
      return "/citizen/dashboard";
    case "BHW_User":
      return "/bhw/dashboard";
    case "Clerk_User":
      return "/staff/dashboard";
    case "BSI_User":
      return "/staff/inspector-dashboard";
    case "Captain_User":
      return "/staff/city-health-officer-dashboard";
    case "LGUAdmin_User":
      return "/lgu/dashboard";
    case "SysAdmin_User":
      return "/admin/dashboard";
    default:
      return "/citizen/dashboard";
  }
};

const RoleDashboard = () => {
  const { user, loading, currentRole, authRealm } = useAuth();
  const navigate = useNavigate();
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    if (!user || loading) return;

    // Citizen users never need HSM profile roles
    if (authRealm === "citizen") {
      setProfileRole("citizen");
      return;
    }

    let cancelled = false;
    const fetchRole = async () => {
      setRoleLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          setProfileRole(null);
          return;
        }

        setProfileRole((data as { role?: string } | null)?.role ?? null);
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
        }
      }
    };

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [authRealm, user, loading]);

  useEffect(() => {
    if (loading || !user || roleLoading) return;

    const pathFromProfile = mapProfileRoleToPath(profileRole);
    const targetPath = pathFromProfile ?? getDashboardPath(currentRole);
    navigate(targetPath, { replace: true });
  }, [currentRole, loading, navigate, profileRole, roleLoading, user]);

  if (loading || roleLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  return null;
};

const CitizenRoute = ({ children }: { children: React.ReactNode }) => {
  const { authRealm, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (authRealm !== "citizen") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const { authRealm, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (authRealm !== "hsm") {
    return <Navigate to="/login" replace />;
  }

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
              {/* Root: always redirect to correct dashboard */}
              <Route path="/" element={<RoleDashboard />} />
              {/* Role-based dashboards */}
              <Route
                path="/citizen/dashboard"
                element={
                  <CitizenRoute>
                    <CitizenDashboard />
                  </CitizenRoute>
                }
              />
              <Route
                path="/bhw/dashboard"
                element={
                  <StaffRoute>
                    <BhwDashboard />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/dashboard"
                element={
                  <StaffRoute>
                    <HealthCenterDashboard />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/inspector-dashboard"
                element={
                  <StaffRoute>
                    <InspectorDashboard />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/city-health-officer-dashboard"
                element={
                  <StaffRoute>
                    <CityHealthOfficerDashboard />
                  </StaffRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <StaffRoute>
                    <LguAdminDashboard />
                  </StaffRoute>
                }
              />
              <Route
                path="/sys/dashboard"
                element={
                  <StaffRoute>
                    <SystemAdminDashboard />
                  </StaffRoute>
                }
              />
              {/* Core module routes */}
              <Route path="/health-center" element={<HealthCenterServices />} />
              <Route path="/sanitation-permit" element={<SanitationPermit />} />
              <Route path="/immunization" element={<ImmunizationTracker />} />
              <Route path="/wastewater" element={<WastewaterServices />} />
              <Route path="/surveillance" element={<HealthSurveillance />} />
              <Route path="/surveillance/map" element={<DiseaseMapDashboard />} />
              {/* Health Center Staff routes */}
              <Route
                path="/staff/scan-qr"
                element={
                  <StaffRoute>
                    <StaffScanQr />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/requests"
                element={
                  <StaffRoute>
                    <StaffRequests />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/assessments"
                element={
                  <StaffRoute>
                    <StaffAssessments />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/permit-verification"
                element={
                  <StaffRoute>
                    <StaffPermitVerification />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/citizen-registration"
                element={
                  <StaffRoute>
                    <StaffCitizenRegistration />
                  </StaffRoute>
                }
              />
              {/* BHW routes */}
              <Route
                path="/citizen-service-assistance"
                element={
                  <StaffRoute>
                    <CitizenAssistance />
                  </StaffRoute>
                }
              />
              {/* Backward compatibility for older links */}
              <Route
                path="/bhw/citizen-assistance"
                element={
                  <StaffRoute>
                    <CitizenAssistance />
                  </StaffRoute>
                }
              />
              <Route
                path="/assisted-requests"
                element={
                  <StaffRoute>
                    <BhwServiceRequests />
                  </StaffRoute>
                }
              />
              <Route
                path="/bhw/requests"
                element={
                  <StaffRoute>
                    <BhwServiceRequests />
                  </StaffRoute>
                }
              />
              <Route
                path="/health-programs/vaccination-requests"
                element={
                  <StaffRoute>
                    <BhwVaccinationRequests />
                  </StaffRoute>
                }
              />
              <Route
                path="/health-programs/nutrition-monitoring"
                element={
                  <StaffRoute>
                    <BhwNutritionMonitoring />
                  </StaffRoute>
                }
              />
              <Route
                path="/bhw/health-programs"
                element={
                  <StaffRoute>
                    <BhwHealthPrograms />
                  </StaffRoute>
                }
              />
              <Route
                path="/bhw/community-reports"
                element={
                  <StaffRoute>
                    <BhwCommunityReports />
                  </StaffRoute>
                }
              />
              <Route
                path="/bhw/complaints"
                element={
                  <StaffRoute>
                    <BhwComplaints />
                  </StaffRoute>
                }
              />
              <Route
                path="/bhw/barangay-health"
                element={
                  <StaffRoute>
                    <BhwBarangayHealth />
                  </StaffRoute>
                }
              />
              {/* LGU Admin routes */}
              <Route
                path="/lgu/requests"
                element={
                  <StaffRoute>
                    <LguRequests />
                  </StaffRoute>
                }
              />
              <Route
                path="/lgu/vaccination"
                element={
                  <StaffRoute>
                    <LguVaccination />
                  </StaffRoute>
                }
              />
              <Route
                path="/lgu/sanitation"
                element={
                  <StaffRoute>
                    <LguSanitation />
                  </StaffRoute>
                }
              />
              <Route
                path="/lgu/analytics"
                element={
                  <StaffRoute>
                    <LguAnalytics />
                  </StaffRoute>
                }
              />
              {/* System Admin routes */}
              <Route path="/sys/users" element={<SystemAdminUsers />} />
              <Route path="/sys/logs" element={<SystemAdminPlaceholder title="System Logs" />} />
              <Route path="/sys/monitoring" element={<SystemAdminPlaceholder title="System Monitoring" />} />
              <Route path="/sys/database" element={<SystemAdminPlaceholder title="Database Management" />} />
              <Route path="/sys/integrations" element={<SystemAdminPlaceholder title="Integration Monitoring" />} />
              <Route path="/sys/requests" element={<SystemAdminPlaceholder title="Requests & Module Performance" />} />
              {/* Citizen routes */}
              <Route path="/citizen/qr" element={<CitizenQR />} />
              <Route path="/citizen/health" element={<HealthServices />} />
              <Route path="/citizen/vaccination" element={<VaccinationNutrition />} />
              <Route path="/citizen/disease-reporting" element={<DiseaseReporting />} />
              <Route path="/citizen/complaints" element={<Complaints />} />
              <Route path="/citizen/sanitation-complaints" element={<Complaints />} />
              <Route path="/citizen/establishments" element={<MyEstablishments />} />
              <Route path="/citizen/sanitary-permit" element={<SanitaryPermitApplication />} />
              <Route path="/citizen/inspections" element={<InspectionStatus />} />
              <Route path="/citizen/certificates" element={<Certificates />} />
              <Route path="/citizen/payments" element={<Payments />} />
              <Route path="/citizen/requests" element={<ServiceRequests />} />
              <Route path="/citizen/waterway-cleanup" element={<WaterwayCleanupReport />} />
              <Route path="/citizen/desludging-schedule" element={<DesludgingScheduleViewer />} />
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
