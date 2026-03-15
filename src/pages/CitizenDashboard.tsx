import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  QrCode, HeartPulse, Syringe, FileText, MessageSquare,
  Building2, FileCheck, Search, ArrowRight, ShieldAlert,
} from "lucide-react";
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
    queryKey: ["citizen_sanitation_complaints_summary", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("sanitation_complaints").select("complaint_id, status").eq("citizen_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const activeRequests = serviceRequests.filter(r => r.status !== "completed").length;
  const pendingComplaints = complaints.filter(c => c.status === "pending").length;

  interface DashCard {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    subtitle: string;
    url: string;
    accent?: boolean;
  }

  const row1: DashCard[] = [
    { title: "My QR Citizen ID", icon: QrCode, subtitle: "View your digital QR ID", url: "/citizen/qr" },
    { title: "Health Services", icon: HeartPulse, subtitle: "View health records", url: "/citizen/health" },
    { title: "Vaccination", icon: Syringe, subtitle: "Vaccination & nutrition", url: "/citizen/vaccination" },
  ];

  const row2: DashCard[] = [
    { title: "Service Requests", icon: FileText, subtitle: activeRequests > 0 ? `${activeRequests} active` : "No active requests", url: "/citizen/requests" },
    { title: "Sanitation Complaints", icon: MessageSquare, subtitle: pendingComplaints > 0 ? `${pendingComplaints} pending` : "No pending", url: "/citizen/sanitation-complaints" },
    { title: "Disease Reports", icon: ShieldAlert, subtitle: "Report disease cases", url: "/citizen/disease-reporting" },
  ];

  const row3: DashCard[] = hasRegisteredEstablishments ? [
    { title: "My Establishments", icon: Building2, subtitle: "Manage establishments", url: "/citizen/establishments", accent: true },
    { title: "Sanitary Permit", icon: FileCheck, subtitle: "Apply & track permits", url: "/citizen/sanitary-permit", accent: true },
    { title: "Inspection Updates", icon: Search, subtitle: "View inspection status", url: "/citizen/inspections", accent: true },
  ] : [
    { title: "My Establishments", icon: Building2, subtitle: "Register a business", url: "/citizen/establishments" },
  ];

  const renderCard = (card: DashCard) => (
    <Card
      key={card.title}
      className={`glass-card cursor-pointer hover:border-primary/40 transition-all group ${card.accent ? "border-primary/20" : ""}`}
      onClick={() => navigate(card.url)}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <card.icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{card.title}</p>
          <p className="text-xs text-muted-foreground truncate">{card.subtitle}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-heading">Citizen Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's a quick overview of your services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {row1.map(renderCard)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {row2.map(renderCard)}
      </div>
      <div className={`grid grid-cols-1 ${row3.length === 3 ? "md:grid-cols-3" : "md:grid-cols-1 max-w-md"} gap-3`}>
        {row3.map(renderCard)}
      </div>
    </div>
  );
};

export default CitizenDashboard;
