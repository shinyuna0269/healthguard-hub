import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RecordDetailModal from "@/components/RecordDetailModal";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Search } from "lucide-react";

const InspectionStatus = () => {
  const { user } = useAuth();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const { data: applications = [] } = useQuery({
    queryKey: ["citizen_sanitary_applications", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sanitary_permit_applications")
        .select("id, establishment_name")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const appIds = applications.map((a) => a.id);

  const { data: inspections = [] } = useQuery({
    queryKey: ["citizen_sanitary_inspections", appIds],
    queryFn: async () => {
      if (appIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sanitary_inspections")
        .select("*")
        .in("application_id", appIds)
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: appIds.length > 0,
  });

  const getEstablishmentName = (applicationId: string) => applications.find((a) => a.id === applicationId)?.establishment_name ?? "—";

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inspections;
    return inspections.filter(
      (i) => getEstablishmentName(i.application_id).toLowerCase().includes(q) || (i.status || "").toLowerCase().includes(q) || (i.result || "").toLowerCase().includes(q)
    );
  }, [inspections, search, applications]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Inspection Status</h1>
        <p className="text-sm text-muted-foreground">Track inspection schedules, results, and corrections for your sanitary permit applications</p>
      </div>

      {selectedRecord && selectedApp && (
        <RecordDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Inspection Details"
          fields={[
            { label: "Establishment", value: selectedApp.establishment_name },
            { label: "Scheduled Date", value: selectedRecord.scheduled_date || "—" },
            { label: "Status", value: selectedRecord.status, isStatus: true },
            { label: "Result", value: selectedRecord.result || "—" },
            { label: "Findings", value: selectedRecord.findings || "—" },
            { label: "Correction Notes", value: selectedRecord.correction_required_notes || "—" },
            { label: "Completed", value: selectedRecord.completed_at ? new Date(selectedRecord.completed_at).toLocaleString() : "—" },
          ]}
        />
      )}

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by establishment, status, or result..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No inspection records yet.</p>
              <p className="text-xs text-muted-foreground">Inspections appear here after payment is confirmed and the inspector schedules a visit.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Establishment</TableHead>
                  <TableHead className="text-xs">Scheduled Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow
                    key={i.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedRecord(i);
                      setSelectedApp(applications.find((a) => a.id === i.application_id));
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell className="text-sm font-medium">{getEstablishmentName(i.application_id)}</TableCell>
                    <TableCell className="text-sm">{i.scheduled_date || "—"}</TableCell>
                    <TableCell><StatusBadge status={i.status} /></TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{i.result || "—"}</TableCell>
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

export default InspectionStatus;
