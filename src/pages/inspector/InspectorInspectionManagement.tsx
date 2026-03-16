import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import RecordDetailModal, { type DetailField } from "@/components/RecordDetailModal";
import StatusBadge from "@/components/StatusBadge";
import { ClipboardCheck, CalendarDays, Search } from "lucide-react";

type InspectionRow = {
  id: string;
  status: string;
  scheduled_date: string | null;
  completed_at: string | null;
  inspector_id: string | null;
  result: string | null;
  findings: string | null;
  application?: {
    establishment_name?: string | null;
    barangay?: string | null;
    owner_name?: string | null;
  } | null;
};

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const InspectorInspectionManagement = () => {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [detail, setDetail] = useState<InspectionRow | null>(null);

  const { data: inspections = [], isLoading, error } = useQuery({
    queryKey: ["inspector_assigned_inspections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("sanitary_inspections")
        .select(
          "id,status,scheduled_date,completed_at,inspector_id,result,findings,application:application_id(establishment_name,barangay,owner_name)",
        )
        .eq("inspector_id", user.id)
        .order("scheduled_date", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as InspectionRow[];
    },
    enabled: !loading && !!user,
    refetchInterval: 30000,
  });

  const statuses = useMemo(() => {
    return [...new Set(inspections.map((i) => i.status).filter(Boolean))].sort();
  }, [inspections]);

  const barangays = useMemo(() => {
    return [...new Set(inspections.map((i) => i.application?.barangay).filter(Boolean) as string[])].sort();
  }, [inspections]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inspections.filter((i) => {
      if (filterStatus && i.status !== filterStatus) return false;
      if (filterBarangay && (i.application?.barangay || "") !== filterBarangay) return false;
      if (filterDate && (i.scheduled_date || "") !== filterDate) return false;
      if (!q) return true;
      const hay = [
        i.id,
        i.status,
        i.scheduled_date || "",
        i.application?.establishment_name || "",
        i.application?.barangay || "",
        i.application?.owner_name || "",
        i.result || "",
        i.findings || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [inspections, search, filterStatus, filterBarangay, filterDate]);

  const selectedISO = selectedDate ? toISODate(selectedDate) : "";
  const eventsForSelected = useMemo(() => {
    if (!selectedISO) return [];
    return inspections.filter((i) => (i.scheduled_date || "") === selectedISO);
  }, [inspections, selectedISO]);

  const detailFields = (row: InspectionRow): DetailField[] => [
    { label: "Inspection ID", value: row.id },
    { label: "Establishment", value: row.application?.establishment_name },
    { label: "Barangay", value: row.application?.barangay },
    { label: "Owner", value: row.application?.owner_name },
    { label: "Inspection Date", value: row.scheduled_date },
    { label: "Status", value: row.status, isStatus: true },
    { label: "Result", value: row.result },
    { label: "Findings", value: row.findings },
    { label: "Completed At", value: row.completed_at ? new Date(row.completed_at).toLocaleString() : null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Inspection Management</h1>
        <p className="text-sm text-muted-foreground">
          Assigned inspections and schedule calendar for field operations
        </p>
      </div>

      <Tabs defaultValue="assigned">
        <TabsList>
          <TabsTrigger value="assigned">Assigned Inspections</TabsTrigger>
          <TabsTrigger value="calendar">Inspection Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Assigned Inspections
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inspection, establishment, barangay..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-60"
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
                <p className="text-sm text-muted-foreground py-6 text-center">Loading inspections...</p>
              ) : error ? (
                <p className="text-sm text-destructive py-6 text-center">Failed to load inspections.</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No assigned inspections found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Inspection</TableHead>
                      <TableHead className="text-xs">Establishment</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Barangay</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="text-xs font-mono">{i.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {i.application?.establishment_name || "—"}
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell">
                          {i.application?.barangay || "—"}
                        </TableCell>
                        <TableCell className="text-sm">{i.scheduled_date || "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={i.status} />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setDetail(i)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="glass-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" /> Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card className="glass-card lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-heading">
                  Scheduled Inspections {selectedISO ? `(${selectedISO})` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsForSelected.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No inspections scheduled for this date.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {eventsForSelected.map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => setDetail(i)}
                        className="w-full text-left p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {i.application?.establishment_name || "Establishment"}
                          </p>
                          <StatusBadge status={i.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {i.application?.barangay || "—"} · Inspection {i.id.slice(0, 8)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <RecordDetailModal
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Inspection Details"
        fields={detail ? detailFields(detail) : []}
      />
    </div>
  );
};

export default InspectorInspectionManagement;

