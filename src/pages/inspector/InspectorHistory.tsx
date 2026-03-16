import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RecordDetailModal, { type DetailField } from "@/components/RecordDetailModal";
import StatusBadge from "@/components/StatusBadge";
import { Search, History } from "lucide-react";

type InspectionRow = {
  id: string;
  status: string;
  scheduled_date: string | null;
  completed_at: string | null;
  result: string | null;
  findings: string | null;
  application?: {
    establishment_name?: string | null;
    barangay?: string | null;
    owner_name?: string | null;
  } | null;
};

const InspectorHistory = () => {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detail, setDetail] = useState<InspectionRow | null>(null);

  const { data: inspections = [], isLoading, error } = useQuery({
    queryKey: ["inspector_history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("sanitary_inspections")
        .select(
          "id,status,scheduled_date,completed_at,result,findings,application:application_id(establishment_name,barangay,owner_name)",
        )
        .eq("inspector_id", user.id)
        .order("scheduled_date", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as InspectionRow[];
    },
    enabled: !loading && !!user,
  });

  const barangays = useMemo(() => {
    return [...new Set(inspections.map((i) => i.application?.barangay).filter(Boolean) as string[])].sort();
  }, [inspections]);

  const statuses = useMemo(() => {
    return [...new Set(inspections.map((i) => i.status).filter(Boolean))].sort();
  }, [inspections]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inspections.filter((i) => {
      if (filterBarangay && (i.application?.barangay || "") !== filterBarangay) return false;
      if (filterStatus && i.status !== filterStatus) return false;
      const d = i.scheduled_date || "";
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      if (!q) return true;
      const hay = [
        i.id,
        i.status,
        i.scheduled_date || "",
        i.application?.establishment_name || "",
        i.application?.barangay || "",
        i.result || "",
        i.findings || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [inspections, search, filterBarangay, filterStatus, dateFrom, dateTo]);

  const detailFields = (row: InspectionRow): DetailField[] => [
    { label: "Inspection ID", value: row.id },
    { label: "Establishment", value: row.application?.establishment_name },
    { label: "Barangay", value: row.application?.barangay },
    { label: "Owner", value: row.application?.owner_name },
    { label: "Inspection Date", value: row.scheduled_date },
    { label: "Status", value: row.status, isStatus: true },
    { label: "Outcome / Result", value: row.result },
    { label: "Violation Findings", value: row.findings },
    { label: "Completed At", value: row.completed_at ? new Date(row.completed_at).toLocaleString() : null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Inspection History</h1>
        <p className="text-sm text-muted-foreground">
          Past inspections, outcomes, and violation records (assigned inspector only)
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> History
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search establishment, barangay, findings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-64"
              />
            </div>
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
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-40" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-40" />
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setSearch("");
                setFilterBarangay("");
                setFilterStatus("");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading history...</p>
          ) : error ? (
            <p className="text-sm text-destructive py-6 text-center">Failed to load inspection history.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No inspection history found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Inspection</TableHead>
                  <TableHead className="text-xs">Establishment</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Barangay</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Outcome</TableHead>
                  <TableHead className="text-xs w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="text-xs font-mono">{i.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm font-medium">{i.application?.establishment_name || "—"}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{i.application?.barangay || "—"}</TableCell>
                    <TableCell className="text-sm">{i.scheduled_date || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={i.status} />
                    </TableCell>
                    <TableCell className="text-sm hidden lg:table-cell">{i.result || "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setDetail(i)}>
                        View
                      </Button>
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
        title="Inspection Record"
        fields={detail ? detailFields(detail) : []}
      />
    </div>
  );
};

export default InspectorHistory;

