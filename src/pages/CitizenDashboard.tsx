import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CitizenDashboard = () => {
  const { user, hasRegisteredEstablishments } = useAuth();
  const navigate = useNavigate();

  const { data: serviceRequests = [] } = useQuery({
    queryKey: ["citizen_requests_summary", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("id, status").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["citizen_complaints", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from("sanitation_complaints").select("complaint_id, status").eq("citizen_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const activeRequests = serviceRequests.filter(r => r.status !== "completed").length;
  const pendingComplaints = complaints.filter(c => c.status === "pending").length;

  const navigateTo = (url: string) => () => navigate(url);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-heading">Citizen Dashboard</h1>
        <p className="text-sm text-muted-foreground">Access your health and sanitation services.</p>
      </div>

      {/* Hero panel: My QR Citizen ID */}
      <Card
        className="cursor-pointer border-none bg-gradient-to-r from-emerald-700 to-emerald-500 text-white shadow-md"
        onClick={navigateTo("/citizen/qr")}
      >
        <CardContent className="p-5 flex flex-col gap-1">
          <p className="text-xs font-medium tracking-wide uppercase/relaxed opacity-80">My QR Citizen ID</p>
          <p className="text-lg font-semibold">Access your digital citizen identification</p>
        </CardContent>
      </Card>

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="glass-card cursor-pointer hover:border-emerald-500/50" onClick={navigateTo("/citizen/health")}>
          <CardContent className="p-4">
            <p className="text-sm font-semibold">Health Services</p>
            <p className="text-xs text-muted-foreground mt-1">View your health records</p>
          </CardContent>
        </Card>
        <Card className="glass-card cursor-pointer hover:border-emerald-500/50" onClick={navigateTo("/citizen/vaccination")}>
          <CardContent className="p-4">
            <p className="text-sm font-semibold">Vaccination</p>
            <p className="text-xs text-muted-foreground mt-1">Vaccination and nutrition</p>
          </CardContent>
        </Card>
        <Card className="glass-card cursor-pointer hover:border-emerald-500/50" onClick={navigateTo("/citizen/requests")}>
          <CardContent className="p-4">
            <p className="text-sm font-semibold">Service Requests</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeRequests > 0 ? `${activeRequests} active` : "Track submitted requests"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="glass-card cursor-pointer hover:border-emerald-500/50" onClick={navigateTo("/citizen/complaints")}>
          <CardContent className="p-4">
            <p className="text-sm font-semibold">Sanitation Complaints</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingComplaints > 0 ? `${pendingComplaints} pending` : "Submit sanitation related complaints"}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card cursor-pointer hover:border-emerald-500/50" onClick={navigateTo("/citizen/disease-reporting")}>
          <CardContent className="p-4">
            <p className="text-sm font-semibold">Disease Reports</p>
            <p className="text-xs text-muted-foreground mt-1">Report possible disease cases</p>
          </CardContent>
        </Card>
        <Card className="glass-card cursor-pointer hover:border-emerald-500/50" onClick={navigateTo("/citizen/establishments")}>
          <CardContent className="p-4">
            <p className="text-sm font-semibold">My Establishments</p>
            <p className="text-xs text-muted-foreground mt-1">
              {hasRegisteredEstablishments ? "Manage your business" : "Register and manage your business"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CitizenDashboard;
