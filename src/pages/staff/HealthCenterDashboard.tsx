import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { QrCode, UserPlus, Stethoscope, Syringe, FileText, ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const HealthCenterDashboard = () => {
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);

  const { data: consultations = [] } = useQuery({
    queryKey: ["hc_consultations_today", today],
    queryFn: async () => {
      const { data } = await supabase
        .from("consultations")
        .select("id, consultation_date, status")
        .eq("consultation_date", today);
      return data || [];
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["hc_requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_requests")
        .select("id, status, request_type")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const newRequests = requests.filter((r) => r.status === "Submitted").length;
  const underReview = requests.filter((r) => r.status === "Under Review").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Health Center Staff Dashboard</h1>
        <p className="text-sm text-muted-foreground">Fast clinic workflow and request processing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          className="glass-card cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => navigate("/staff/scan-qr")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" /> Citizen Visits Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {consultations.length} consultations recorded today
            </p>
            <div className="flex flex-col gap-1.5">
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/staff/scan-qr")}>
                Scan QR Citizen ID
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/staff/consultations")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" /> Consultations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">New consultation and records</p>
            <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/staff/consultations")}>
              Open Consultations
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/staff/vaccination")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Syringe className="h-4 w-4 text-primary" /> Vaccination Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Queue, records, and scheduling</p>
            <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/staff/vaccination")}>
              Open Vaccination Services
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/staff/requests")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Service Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {newRequests} new · {underReview} under review
            </p>
            <div className="flex flex-col gap-1.5">
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/staff/requests")}>
                Review Requests
              </Button>
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/staff/requests")}>
                Process Requests
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/staff/permit-verification")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Sanitation Permit Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Verify documents and forward for inspection scheduling</p>
            <div className="flex flex-col gap-1.5">
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/staff/permit-verification")}>
                Verify Documents
              </Button>
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/sanitation-permit")}>
                View Applications
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/staff/scan-qr")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" /> Citizen Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Scan QR and access health history</p>
            <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/staff/scan-qr")}>
              Scan QR Citizen ID
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthCenterDashboard;

