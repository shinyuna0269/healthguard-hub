import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const RoleDashboard = () => {
  const { currentRole } = useAuth();
  const isCitizen = currentRole === "Citizen_User" || currentRole === "BusinessOwner_User";

  if (isCitizen) return <CitizenDashboard />;
  if (currentRole === "BHW_User") return <BhwDashboard />;
  if (currentRole === "Clerk_User") return <HealthCenterDashboard />;
  if (currentRole === "BSI_User") return <InspectorDashboard />;
  if (currentRole === "Captain_User") return <CityHealthOfficerDashboard />;
  if (currentRole === "LGUAdmin_User") return <LguAdminDashboard />;
  if (currentRole === "SysAdmin_User") return <SystemAdminDashboard />;

  return <Dashboard />;
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
              <Route path="/" element={<RoleDashboard />} />
              {/* Core module routes */}
              <Route path="/health-center" element={<HealthCenterServices />} />
              <Route path="/sanitation-permit" element={<SanitationPermit />} />
              <Route path="/immunization" element={<ImmunizationTracker />} />
              <Route path="/wastewater" element={<WastewaterServices />} />
              <Route path="/surveillance" element={<HealthSurveillance />} />
              <Route path="/surveillance/map" element={<DiseaseMapDashboard />} />
              {/* Health Center Staff routes */}
              <Route path="/staff/scan-qr" element={<StaffScanQr />} />
              <Route path="/staff/requests" element={<StaffRequests />} />
              <Route path="/staff/assessments" element={<StaffAssessments />} />
              <Route path="/staff/permit-verification" element={<StaffPermitVerification />} />
              <Route path="/staff/citizen-registration" element={<StaffCitizenRegistration />} />
              {/* BHW routes */}
              <Route path="/citizen-service-assistance" element={<CitizenAssistance />} />
              {/* Backward compatibility for older links */}
              <Route path="/bhw/citizen-assistance" element={<CitizenAssistance />} />
              <Route path="/assisted-requests" element={<BhwServiceRequests />} />
              <Route path="/bhw/requests" element={<BhwServiceRequests />} />
              <Route path="/health-programs/vaccination-requests" element={<BhwVaccinationRequests />} />
              <Route path="/health-programs/nutrition-monitoring" element={<BhwNutritionMonitoring />} />
              <Route path="/bhw/health-programs" element={<BhwHealthPrograms />} />
              <Route path="/bhw/community-reports" element={<BhwCommunityReports />} />
              <Route path="/bhw/complaints" element={<BhwComplaints />} />
              <Route path="/bhw/barangay-health" element={<BhwBarangayHealth />} />
              {/* LGU Admin routes */}
              <Route path="/lgu/requests" element={<LguRequests />} />
              <Route path="/lgu/vaccination" element={<LguVaccination />} />
              <Route path="/lgu/sanitation" element={<LguSanitation />} />
              <Route path="/lgu/analytics" element={<LguAnalytics />} />
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
