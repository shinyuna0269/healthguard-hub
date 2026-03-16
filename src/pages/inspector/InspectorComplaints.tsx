import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RecordDetailModal, { type DetailField } from "@/components/RecordDetailModal";
import StatusBadge from "@/components/StatusBadge";
import { FileText, Search } from "lucide-react";
import { toast } from "sonner";

type ComplaintRow = {
  complaint_id: string;
  citizen_id: string | null;
  complaint_type: string;
  barangay: string;
  description: string | null;
  photo_attachment: string | null;
  status: string;
  assigned_officer: string | null;
  date_submitted: string;
  created_at: string;
};

const InspectorComplaints = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [detail, setDetail] = useState<ComplaintRow | null>(null);

  const { data: complaints = [], isLoading, error } = useQuery({
    queryKey: ["inspector_sanitation_complaints_all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sanitation_complaints")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as ComplaintRow[];
    },
    enabled: !loading && !!user,
    refetchInterval: 30000,
  });

  const statuses = useMemo(() => [...new Set(complaints.map((c) => c.status).filter(Boolean))].sort(), [complaints]);
  const barangays = useMemo(() => [...new Set(complaints.map((c) => c.barangay).filter(Boolean))].sort(), [complaints]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter((c) => {
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterBarangay && c.barangay !== filterBarangay) return false;
      if (filterDate && c.date_submitted !== filterDate) return false;
      if (!q) return true;
      const hay = [
        c.complaint_id,
        c.complaint_type,
        c.barangay,
        c.status,
        c.description || "",
        c.assigned_officer || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [complaints, search, filterStatus, filterBarangay, filterDate]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ complaint_id, status }: { complaint_id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("sanitation_complaints")
        .update({ status })
        .eq("complaint_id", complaint_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspector_sanitation_complaints_all"] });
      toast.success("Complaint status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const detailsFields = (row: ComplaintRow): DetailField[] => [
    { label: "Complaint ID", value: row.complaint_id },
    { label: "Complaint Type", value: row.complaint_type },
    { label: "Barangay", value: row.barangay },
    { label: "Reported Date", value: row.date_submitted },
    { label: "Status", value: row.status, isStatus: true },
    { label: "Assigned Officer", value: row.assigned_officer },
    { label: "Description", value: row.description },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Complaint Reports</h1>
        <p className="text-sm text-muted-foreground">
          Sanitation complaints intake and investigation status updates
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Complaints
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search type, barangay, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-64"
              />
            </div>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={filterBarangay}
              onChange={(e) => setFilterBarangay(e.target.value)}
            >
              <option value="">All barangays</option>
              {barangays.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="h-8 w-44"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setSearch("");
                setFilterStatus("");
                setFilterBarangay("");
                setFilterDate("");
              }}
            >
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading complaints...</p>
          ) : error ? (
            <p className="text-sm text-destructive py-6 text-center">Failed to load complaints.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No complaints found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Reported</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-72"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.complaint_id}>
                    <TableCell className="text-xs font-mono">{c.complaint_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm font-medium">{c.complaint_type}</TableCell>
                    <TableCell className="text-sm">{c.barangay}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{c.date_submitted}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setDetail(c)}
                        >
                          View details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => updateStatusMutation.mutate({ complaint_id: c.complaint_id, status: "inspected" })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Mark inspected
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => updateStatusMutation.mutate({ complaint_id: c.complaint_id, status: "resolved" })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Resolve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RecordDetailModal
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Complaint Details"
        fields={detail ? detailsFields(detail) : []}
      />
    </div>
  );
};

export default InspectorComplaints;

