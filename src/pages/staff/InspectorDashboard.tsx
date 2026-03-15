import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, CalendarDays, MessageSquare, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const InspectorDashboard = () => {
  const navigate = useNavigate();

  const { data: inspections = [] } = useQuery({
    queryKey: ["inspector_inspections"],
    queryFn: async () => {
      const { data } = await supabase.from("inspections").select("id").limit(200);
      return data || [];
    },
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["inspector_sanitation_complaints"],
    queryFn: async () => {
      const { data } = await supabase.from("sanitation_complaints").select("complaint_id, status").limit(200);
      return data || [];
    },
  });

  const pendingComplaints = complaints.filter((c) => c.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Sanitation Inspector Dashboard</h1>
        <p className="text-sm text-muted-foreground">Tablet-friendly inspection workflow and reporting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/sanitation-permit")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Assigned Inspections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">{inspections.length} inspections in system</p>
            <div className="flex flex-col gap-1.5">
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/sanitation-permit")}>
                View Assigned Inspections
              </Button>
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/sanitation-permit")}>
                Open Inspection Calendar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/wastewater")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Sanitation Complaints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">{pendingComplaints} complaints pending investigation</p>
            <div className="flex flex-col gap-1.5">
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/wastewater")}>
                View Complaint Inspections
              </Button>
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/wastewater")}>
                Submit Complaint Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/sanitation-permit")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-primary" /> Correction Notices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Issue correction notices and schedule re-inspections</p>
            <div className="flex flex-col gap-1.5">
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/sanitation-permit")}>
                Issue Correction Notice
              </Button>
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/sanitation-permit")}>
                View Compliance Status
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/sanitation-permit")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Re-Inspections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Review re-inspection schedule for corrected establishments</p>
            <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => navigate("/sanitation-permit")}>
              Scheduled Re-Inspections
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InspectorDashboard;

