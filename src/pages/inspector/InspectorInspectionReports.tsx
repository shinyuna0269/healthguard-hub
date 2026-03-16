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
import { FileText, Search, Download } from "lucide-react";

type ReportRow = {
  report_id: string;
  inspection_id: string;
  establishment_name: string | null;
  barangay: string | null;
  inspection_date: string | null;
  violations_found: string | null;
  compliance_status: string;
  inspector_name: string | null;
  created_at: string;
  report_details: any;
};

const InspectorInspectionReports = () => {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterCompliance, setFilterCompliance] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [detail, setDetail] = useState<ReportRow | null>(null);

  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ["inspector_inspection_reports"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("inspection_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as ReportRow[];
    },
    enabled: !loading && !!user,
    refetchInterval: 30000,
  });

  const barangays = useMemo(() => {
    return [...new Set(reports.map((r) => r.barangay).filter(Boolean) as string[])].sort();
  }, [reports]);

  const complianceStatuses = useMemo(() => {
    return [...new Set(reports.map((r) => r.compliance_status).filter(Boolean))].sort();
  }, [reports]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (filterBarangay && (r.barangay || "") !== filterBarangay) return false;
      if (filterCompliance && r.compliance_status !== filterCompliance) return false;
      if (filterDate && (r.inspection_date || "") !== filterDate) return false;
      if (!q) return true;
      const hay = [
        r.report_id,
        r.inspection_id,
        r.establishment_name || "",
        r.barangay || "",
        r.violations_found || "",
        r.compliance_status || "",
        r.inspector_name || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [reports, search, filterBarangay, filterCompliance, filterDate]);

  const detailFields = (row: ReportRow): DetailField[] => [
    { label: "Report ID", value: row.report_id },
    { label: "Inspection ID", value: row.inspection_id },
    { label: "Establishment", value: row.establishment_name },
    { label: "Barangay", value: row.barangay },
    { label: "Inspection Date", value: row.inspection_date },
    { label: "Violations Found", value: row.violations_found },
    { label: "Compliance Status", value: row.compliance_status, isStatus: true },
    { label: "Inspector", value: row.inspector_name },
    { label: "Created", value: new Date(row.created_at).toLocaleString() },
  ];

  const downloadReport = (row: ReportRow) => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            ...row,
            downloaded_at: new Date().toISOString(),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inspection-report_${row.report_id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Inspection Reports</h1>
        <p className="text-sm text-muted-foreground">
          Reports created by inspectors (search and filter)
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Reports
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search establishment, barangay, inspector..."
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
              value={filterCompliance}
              onChange={(e) => setFilterCompliance(e.target.value)}
            >
              <option value="">All compliance statuses</option>
              {complianceStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
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
                setFilterBarangay("");
                setFilterCompliance("");
                setFilterDate("");
              }}
            >
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading reports...</p>
          ) : error ? (
            <p className="text-sm text-destructive py-6 text-center">
              Failed to load reports. (If this is a new environment, run the latest migrations.)
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No reports found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Inspection</TableHead>
                  <TableHead className="text-xs">Establishment</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Barangay</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Compliance</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Inspector</TableHead>
                  <TableHead className="text-xs w-36"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.report_id}>
                    <TableCell className="text-xs font-mono">{r.inspection_id?.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm font-medium">{r.establishment_name || "—"}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{r.barangay || "—"}</TableCell>
                    <TableCell className="text-sm">{r.inspection_date || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.compliance_status} />
                    </TableCell>
                    <TableCell className="text-sm hidden lg:table-cell">{r.inspector_name || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setDetail(r)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => downloadReport(r)}
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download
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
        title="Inspection Report"
        fields={detail ? detailFields(detail) : []}
      />
    </div>
  );
};

export default InspectorInspectionReports;

