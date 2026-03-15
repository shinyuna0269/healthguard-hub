import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ClipboardCheck, CheckCircle2, Calendar, FileCheck, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const INSPECTION_CHECKLIST_ITEMS = [
  "Cleanliness of establishment",
  "Waste disposal system",
  "Food handling compliance",
  "Water quality compliance",
  "Pest control compliance",
  "Employee hygiene and health certificates",
];

const STATUS_LABELS: Record<string, string> = {
  application_submitted: "Application Submitted",
  provisional_permit_issued: "Provisional Issued",
  payment_confirmed: "Payment Confirmed",
  inspection_scheduled: "Inspection Scheduled",
  inspection_completed: "Inspection Completed",
  correction_required: "Correction Required",
  reinspection_requested: "Reinspection Requested",
  permit_approved: "Permit Approved",
  permit_issued: "Permit Issued",
};

const SanitationPermit = () => {
  const { currentRole, user } = useAuth();
  const [search, setSearch] = useState("");
  const [confirmPaymentApp, setConfirmPaymentApp] = useState<any>(null);
  const [scheduleApp, setScheduleApp] = useState<any>(null);
  const [inspectApp, setInspectApp] = useState<any>(null);
  const [issuePermitApp, setIssuePermitApp] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [findings, setFindings] = useState("");
  const [inspectionResult, setInspectionResult] = useState<"passed" | "failed" | "correction_required">("passed");
  const [correctionNotes, setCorrectionNotes] = useState("");
  const queryClient = useQueryClient();

  const isBSI = currentRole === "BSI_User";
  const isClerk = currentRole === "Clerk_User";
  const isCaptain = currentRole === "Captain_User";
  const isStaff = isClerk || isCaptain;

  const { data: applications = [] } = useQuery({
    queryKey: ["staff_sanitary_applications", currentRole, user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sanitary_permit_applications")
        .select("*")
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: inspectionsList = [] } = useQuery({
    queryKey: ["sanitary_inspections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sanitary_inspections").select("*").order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (a) =>
        a.establishment_name?.toLowerCase().includes(q) ||
        a.owner_name?.toLowerCase().includes(q) ||
        a.order_of_payment_number?.toLowerCase().includes(q)
    );
  }, [applications, search]);

  const forInspector = useMemo(
    () =>
      filtered.filter((a) =>
        ["payment_confirmed", "inspection_scheduled", "correction_required", "reinspection_requested"].includes(a.status)
      ),
    [filtered]
  );

  const confirmPaymentMutation = useMutation({
    mutationFn: async (app: any) => {
      if (!app.payment_id) throw new Error("No payment linked");
      await supabase.from("payments").update({ status: "confirmed", paid_at: new Date().toISOString() }).eq("id", app.payment_id);
      await supabase.from("sanitary_permit_applications").update({ status: "payment_confirmed" }).eq("id", app.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_sanitary_applications"] });
      queryClient.invalidateQueries({ queryKey: ["citizen_payments"] });
      setConfirmPaymentApp(null);
      toast.success("Payment confirmed. Application forwarded to Sanitary Inspector.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const minInspectionDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const maxInspectionDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().slice(0, 10);
  })();

  const scheduleInspectionMutation = useMutation({
    mutationFn: async ({ app, date, notes }: { app: any; date: string; notes: string }) => {
      await supabase.from("sanitary_inspections").insert({
        application_id: app.id,
        inspector_id: user?.id,
        scheduled_date: date,
        status: "scheduled",
      });
      await supabase
        .from("sanitary_permit_applications")
        .update({
          status: "inspection_scheduled",
          assigned_inspector_id: user?.id,
          inspection_scheduled_date: date,
          inspection_notes: notes || null,
        })
        .eq("id", app.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_sanitary_applications"] });
      queryClient.invalidateQueries({ queryKey: ["sanitary_inspections"] });
      setScheduleApp(null);
      setScheduleDate("");
      setInspectionNotes("");
      toast.success("Inspection scheduled (within 10 days).");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitInspectionMutation = useMutation({
    mutationFn: async ({ app, result, correctionNotes }: { app: any; result: string; correctionNotes: string }) => {
      const insp = inspectionsList.find((i) => i.application_id === app.id && i.status === "scheduled");
      if (insp) {
        await supabase
          .from("sanitary_inspections")
          .update({
            status: "completed",
            result,
            findings: findings,
            checklist: checklist,
            correction_required_notes: result === "correction_required" ? correctionNotes : null,
            completed_at: new Date().toISOString(),
          })
          .eq("id", insp.id);
      }
      const newStatus = result === "passed" ? "permit_approved" : result === "correction_required" ? "correction_required" : "correction_required";
      await supabase
        .from("sanitary_permit_applications")
        .update({
          status: newStatus,
          correction_notes: result === "correction_required" ? correctionNotes : null,
        })
        .eq("id", app.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_sanitary_applications"] });
      queryClient.invalidateQueries({ queryKey: ["sanitary_inspections"] });
      setInspectApp(null);
      setChecklist({});
      setFindings("");
      setInspectionResult("passed");
      setCorrectionNotes("");
      toast.success("Inspection report submitted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const issuePermitMutation = useMutation({
    mutationFn: async (app: any) => {
      const permitNum = `SP-QC-${new Date().getFullYear()}-${app.id.slice(0, 8).toUpperCase()}`;
      const issued = new Date();
      const expiry = new Date(issued);
      expiry.setFullYear(expiry.getFullYear() + 1);
      await supabase
        .from("sanitary_permit_applications")
        .update({
          status: "permit_issued",
          permit_number: permitNum,
          permit_issued_at: issued.toISOString(),
          permit_expiry_date: expiry.toISOString().slice(0, 10),
        })
        .eq("id", app.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_sanitary_applications"] });
      setIssuePermitApp(null);
      toast.success("Digital Sanitary Permit issued.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Sanitation Permit & Inspection</h1>
        <p className="text-sm text-muted-foreground">
          {isBSI ? "Schedule and conduct on-site inspections. Submit inspection reports." : "Process applications, confirm payments, and issue permits."}
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search establishment or order number..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Establishment</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Order of Payment</TableHead>
                <TableHead className="text-xs">Inspection Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isBSI ? forInspector : filtered).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-sm">{a.establishment_name}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell font-mono">{a.order_of_payment_number || "—"}</TableCell>
                  <TableCell className="text-sm">{a.inspection_scheduled_date || "—"}</TableCell>
                  <TableCell><StatusBadge status={STATUS_LABELS[a.status] || a.status} /></TableCell>
                  <TableCell>
                    {isStaff && a.status === "application_submitted" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setConfirmPaymentApp(a)}>
                        <CheckCircle2 className="h-3 w-3" /> Confirm Payment
                      </Button>
                    )}
                    {isBSI && (a.status === "payment_confirmed" || a.status === "reinspection_requested") && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setScheduleApp(a); setScheduleDate(""); setInspectionNotes(""); }}>
                        <Calendar className="h-3 w-3" /> Schedule
                      </Button>
                    )}
                    {isBSI && a.status === "inspection_scheduled" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setInspectApp(a); setChecklist({}); setFindings(""); setInspectionResult("passed"); setCorrectionNotes(""); }}>
                        <ClipboardCheck className="h-3 w-3" /> Submit Report
                      </Button>
                    )}
                    {isStaff && a.status === "permit_approved" && (
                      <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => setIssuePermitApp(a)}>
                        <FileCheck className="h-3 w-3" /> Issue Permit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {((isBSI && forInspector.length === 0) || (!isBSI && filtered.length === 0)) && (
            <p className="text-sm text-muted-foreground text-center py-6">No applications to show.</p>
          )}
        </CardContent>
      </Card>

      {/* Confirm Payment Dialog */}
      <Dialog open={!!confirmPaymentApp} onOpenChange={() => setConfirmPaymentApp(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Payment</DialogTitle></DialogHeader>
          {confirmPaymentApp && (
            <>
              <p className="text-sm">{confirmPaymentApp.establishment_name} — Order of Payment: {confirmPaymentApp.order_of_payment_number}</p>
              <p className="text-xs text-muted-foreground">Confirm that the citizen has paid the sanitary permit fee (QC Pay Easy / Landbank / CTO).</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setConfirmPaymentApp(null)}>Cancel</Button>
                <Button onClick={() => confirmPaymentMutation.mutate(confirmPaymentApp)} disabled={confirmPaymentMutation.isPending}>Confirm Payment</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Inspection Dialog */}
      <Dialog open={!!scheduleApp} onOpenChange={() => setScheduleApp(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Inspection</DialogTitle></DialogHeader>
          {scheduleApp && (
            <>
              <p className="text-sm font-medium">{scheduleApp.establishment_name}</p>
              <div className="grid gap-2">
                <Label className="text-xs">Inspection Date (within 10 days) *</Label>
                <Input type="date" value={scheduleDate} min={minInspectionDate} max={maxInspectionDate} onChange={(e) => setScheduleDate(e.target.value)} />
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="Inspection notes..." value={inspectionNotes} onChange={(e) => setInspectionNotes(e.target.value)} rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setScheduleApp(null)}>Cancel</Button>
                <Button onClick={() => scheduleInspectionMutation.mutate({ app: scheduleApp, date: scheduleDate, notes: inspectionNotes })} disabled={scheduleInspectionMutation.isPending || !scheduleDate}>Schedule</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Inspection Report Dialog */}
      <Dialog open={!!inspectApp} onOpenChange={() => setInspectApp(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Inspection Report</DialogTitle></DialogHeader>
          {inspectApp && (
            <>
              <p className="text-sm font-medium">{inspectApp.establishment_name}</p>
              <div className="space-y-2">
                {INSPECTION_CHECKLIST_ITEMS.map((item) => (
                  <div key={item} className="flex items-center justify-between p-2 rounded-md border border-border">
                    <span className="text-sm">{item}</span>
                    <Switch checked={checklist[item] || false} onCheckedChange={(v) => setChecklist((c) => ({ ...c, [item]: v }))} />
                  </div>
                ))}
              </div>
              <Label className="text-xs">Findings</Label>
              <Textarea placeholder="Inspection findings..." value={findings} onChange={(e) => setFindings(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Label className="text-xs">Result *</Label>
                <div className="flex gap-2 flex-wrap">
                  {(["passed", "failed", "correction_required"] as const).map((r) => (
                    <Button key={r} size="sm" variant={inspectionResult === r ? "default" : "outline"} onClick={() => setInspectionResult(r)}>
                      {r === "passed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {r === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                      {r === "correction_required" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {r.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>
              {(inspectionResult === "correction_required" || inspectionResult === "failed") && (
                <div>
                  <Label className="text-xs">Correction notes (required)</Label>
                  <Textarea placeholder="What must be corrected..." value={correctionNotes} onChange={(e) => setCorrectionNotes(e.target.value)} rows={2} />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setInspectApp(null)}>Cancel</Button>
                <Button
                  onClick={() => submitInspectionMutation.mutate({ app: inspectApp, result: inspectionResult, correctionNotes })}
                  disabled={submitInspectionMutation.isPending || ((inspectionResult === "correction_required" || inspectionResult === "failed") && !correctionNotes.trim())}
                >
                  Submit Report
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Issue Permit Dialog */}
      <Dialog open={!!issuePermitApp} onOpenChange={() => setIssuePermitApp(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Digital Sanitary Permit</DialogTitle></DialogHeader>
          {issuePermitApp && (
            <>
              <p className="text-sm">{issuePermitApp.establishment_name} — Inspection approved. Issue permit (1 year validity)?</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIssuePermitApp(null)}>Cancel</Button>
                <Button onClick={() => issuePermitMutation.mutate(issuePermitApp)} disabled={issuePermitMutation.isPending}>Issue Permit</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SanitationPermit;
