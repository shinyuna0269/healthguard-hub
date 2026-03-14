import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import RecordDetailModal from "@/components/RecordDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { FileText } from "lucide-react";

const ServiceRequests = () => {
  const { user } = useAuth();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: requests = [] } = useQuery({
    queryKey: ["citizen_service_requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">My Service Requests</h1>
        <p className="text-sm text-muted-foreground">Track all your service requests across modules</p>
      </div>

      {selectedRecord && (
        <RecordDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Service Request Details"
          fields={[
            { label: "Title", value: selectedRecord.title },
            { label: "Type", value: selectedRecord.request_type },
            { label: "Description", value: selectedRecord.description },
            { label: "Status", value: selectedRecord.status, isStatus: true },
            { label: "Submitted", value: new Date(selectedRecord.created_at).toLocaleDateString() },
            { label: "Last Updated", value: new Date(selectedRecord.updated_at).toLocaleDateString() },
          ]}
        />
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">All Requests</CardTitle></CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No service requests found.</p>
              <p className="text-xs text-muted-foreground mt-1">Requests from health, vaccination, permits, and complaints will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(r => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRecord(r); setDetailOpen(true); }}>
                    <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{r.request_type}</TableCell>
                    <TableCell className="font-medium text-sm">{r.title}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{r.description || "—"}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceRequests;
