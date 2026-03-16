import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RecordDetailModal, { type DetailField } from "@/components/RecordDetailModal";
import StatusBadge from "@/components/StatusBadge";
import { Award, Plus, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type EstablishmentRow = {
  id: string;
  business_name: string;
  barangay: string | null;
};

type NoticeRow = {
  notice_id: string;
  establishment_id: string | null;
  establishment_name: string | null;
  barangay: string | null;
  violation_type: string;
  notice_date: string;
  compliance_deadline: string | null;
  compliance_status: string;
  notes: string | null;
  issued_by: string | null;
  created_at: string;
};

const InspectorCorrectionNotices = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detail, setDetail] = useState<NoticeRow | null>(null);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    establishment_id: "",
    violation_type: "",
    compliance_deadline: "",
    notes: "",
  });

  const { data: establishments = [] } = useQuery({
    queryKey: ["inspector_notice_establishments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("establishments")
        .select("id,business_name,barangay")
        .order("business_name", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data || []) as EstablishmentRow[];
    },
    enabled: !loading && !!user,
  });

  const { data: notices = [], isLoading, error } = useQuery({
    queryKey: ["inspector_correction_notices"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("correction_notices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as NoticeRow[];
    },
    enabled: !loading && !!user,
    refetchInterval: 30000,
  });

  const barangays = useMemo(() => {
    return [...new Set((notices.map((n) => n.barangay).filter(Boolean) as string[]).concat(establishments.map((e) => e.barangay).filter(Boolean) as string[]))].sort();
  }, [notices, establishments]);

  const statuses = useMemo(() => {
    return [...new Set(notices.map((n) => n.compliance_status).filter(Boolean))].sort();
  }, [notices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notices.filter((n) => {
      if (filterBarangay && (n.barangay || "") !== filterBarangay) return false;
      if (filterStatus && n.compliance_status !== filterStatus) return false;
      if (!q) return true;
      const hay = [
        n.notice_id,
        n.establishment_name || "",
        n.barangay || "",
        n.violation_type || "",
        n.compliance_status || "",
        n.notes || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [notices, search, filterBarangay, filterStatus]);

  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!form.establishment_id) throw new Error("Select an establishment");
      if (!form.violation_type.trim()) throw new Error("Violation type is required");
      const est = establishments.find((e) => e.id === form.establishment_id);
      const payload = {
        establishment_id: form.establishment_id,
        establishment_name: est?.business_name ?? null,
        barangay: est?.barangay ?? null,
        violation_type: form.violation_type.trim(),
        compliance_deadline: form.compliance_deadline || null,
        compliance_status: "pending",
        notes: form.notes.trim() || null,
        issued_by: user.id,
      };
      const { error } = await (supabase as any).from("correction_notices").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspector_correction_notices"] });
      setOpen(false);
      setForm({ establishment_id: "", violation_type: "", compliance_deadline: "", notes: "" });
      toast.success("Correction notice issued");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markCompliantMutation = useMutation({
    mutationFn: async ({ notice_id }: { notice_id: string }) => {
      const { error } = await (supabase as any)
        .from("correction_notices")
        .update({ compliance_status: "compliant" })
        .eq("notice_id", notice_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspector_correction_notices"] });
      toast.success("Marked as compliant");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const detailFields = (row: NoticeRow): DetailField[] => [
    { label: "Notice ID", value: row.notice_id },
    { label: "Establishment", value: row.establishment_name },
    { label: "Barangay", value: row.barangay },
    { label: "Violation Type", value: row.violation_type },
    { label: "Notice Date", value: row.notice_date },
    { label: "Compliance Deadline", value: row.compliance_deadline },
    { label: "Compliance Status", value: row.compliance_status, isStatus: true },
    { label: "Notes", value: row.notes },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading">Correction Notices</h1>
          <p className="text-sm text-muted-foreground">Issue notices and monitor compliance</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Issue Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Issue Correction Notice</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label className="text-xs">Establishment *</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm mt-1"
                  value={form.establishment_id}
                  onChange={(e) => setForm((f) => ({ ...f, establishment_id: e.target.value }))}
                >
                  <option value="">Select establishment</option>
                  {establishments.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.business_name} {e.barangay ? `(${e.barangay})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Violation Type *</Label>
                <Input
                  placeholder="e.g., Improper waste disposal"
                  value={form.violation_type}
                  onChange={(e) => setForm((f) => ({ ...f, violation_type: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Compliance Deadline</Label>
                <Input
                  type="date"
                  value={form.compliance_deadline}
                  onChange={(e) => setForm((f) => ({ ...f, compliance_deadline: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => issueMutation.mutate()}
                disabled={issueMutation.isPending}
              >
                {issueMutation.isPending ? "Issuing..." : "Issue Notice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Notices
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search establishment, violation, status..."
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
              <option value="">All compliance statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setSearch("");
                setFilterBarangay("");
                setFilterStatus("");
              }}
            >
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading notices...</p>
          ) : error ? (
            <p className="text-sm text-destructive py-6 text-center">
              Failed to load notices. (Run latest migrations if needed.)
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No notices found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Notice</TableHead>
                  <TableHead className="text-xs">Establishment</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Barangay</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Violation</TableHead>
                  <TableHead className="text-xs">Deadline</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-56"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((n) => (
                  <TableRow key={n.notice_id}>
                    <TableCell className="text-xs font-mono">{n.notice_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm font-medium">{n.establishment_name || "—"}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{n.barangay || "—"}</TableCell>
                    <TableCell className="text-sm hidden lg:table-cell truncate max-w-[220px]">{n.violation_type}</TableCell>
                    <TableCell className="text-sm">{n.compliance_deadline || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={n.compliance_status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setDetail(n)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => markCompliantMutation.mutate({ notice_id: n.notice_id })}
                          disabled={markCompliantMutation.isPending || String(n.compliance_status).toLowerCase() === "compliant"}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Mark compliant
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
        title="Correction Notice Details"
        fields={detail ? detailFields(detail) : []}
      />
    </div>
  );
};

export default InspectorCorrectionNotices;

