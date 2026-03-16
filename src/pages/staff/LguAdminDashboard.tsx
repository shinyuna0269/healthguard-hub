import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart3, ShieldAlert, Syringe, ClipboardCheck, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const LguAdminDashboard = () => {
  const navigate = useNavigate();

  const { data: requests = [] } = useQuery({
    queryKey: ["lgu_requests"],
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("id, status").limit(500);
      return data || [];
    },
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["lgu_disease_cases"],
    queryFn: async () => {
      const { data } = await supabase.from("surveillance_cases").select("id, disease, status").limit(500);
      return data || [];
    },
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["lgu_vaccinations"],
    queryFn: async () => {
      const { data } = await supabase.from("vaccinations").select("id").limit(500);
      return data || [];
    },
  });

  const { data: permits = [] } = useQuery({
    queryKey: ["lgu_permits"],
    queryFn: async () => {
      const { data } = await supabase.from("sanitation_permits").select("id, status").limit(500);
      return data || [];
    },
  });

  const underReview = requests.filter((r) => r.status === "Under Review").length;
  const activeCases = cases.filter((c) => c.status === "active" || c.status === "Active").length;
  const pendingPermits = permits.filter((p) => p.status === "pending" || p.status === "Under Review").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">LGU Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Municipal monitoring and analytics (read-only). No approvals, no user management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/lgu/requests")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Real-Time Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {requests.length} total · {underReview} under review
            </p>
            <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/lgu/requests")}>
              View Requests
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/surveillance/map")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Disease Surveillance Map
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">{activeCases} active cases · {cases.length} total</p>
            <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/surveillance/map")}>
              Open Mapping Dashboard
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/lgu/vaccination")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Syringe className="h-4 w-4 text-primary" /> Vaccination Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">{vaccinations.length} vaccination records</p>
            <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/lgu/vaccination")}>
              View Reports
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/lgu/sanitation")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Establishment Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">{pendingPermits} permits pending / under review</p>
            <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/lgu/sanitation")}>
              View Compliance
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/lgu/analytics")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Municipal Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Trends, charts, and barangay filtering</p>
            <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/lgu/analytics")}>
              Open Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LguAdminDashboard;

