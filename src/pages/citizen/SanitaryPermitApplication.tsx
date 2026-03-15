import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import RecordDetailModal from "@/components/RecordDetailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { FileCheck, Plus, Upload, AlertTriangle, Download, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { safeRandomId } from "@/lib/safeId";

const STATUS_LABELS: Record<string, string> = {
  application_submitted: "Application Submitted",
  provisional_permit_issued: "Provisional Permit Issued",
  payment_confirmed: "Payment Confirmed",
  inspection_scheduled: "Inspection Scheduled",
  inspection_completed: "Inspection Completed",
  correction_required: "Correction Required",
  reinspection_requested: "Reinspection Requested",
  permit_approved: "Permit Approved",
  permit_issued: "Permit Issued",
};

const SANITARY_FEE = 500;

const SanitaryPermitApplication = () => {
  const { user, userName } = useAuth();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string>("");
  const [docFiles, setDocFiles] = useState<Record<string, File>>({});
  const [isProvisional, setIsProvisional] = useState(false);
  const [reinspectionFile, setReinspectionFile] = useState<File | null>(null);
  const [reinspectionApp, setReinspectionApp] = useState<any>(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: establishments = [] } = useQuery({
    queryKey: ["citizen_establishments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "registered")
        .order("business_name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["citizen_sanitary_applications", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sanitary_permit_applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (a) =>
        (a.establishment_name || "").toLowerCase().includes(q) ||
        (a.order_of_payment_number || "").toLowerCase().includes(q) ||
        (STATUS_LABELS[a.status] || a.status || "").toLowerCase().includes(q)
    );
  }, [applications, search]);

  const selectedEstablishment = establishments.find((e) => e.id === selectedEstablishmentId);

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEstablishment) throw new Error("Select an establishment");
      const appId = safeRandomId("").slice(0, 8).toUpperCase();
      const orderNum = `OP-QC-${new Date().getFullYear()}-${appId}`;

      const { data: app, error: appErr } = await (supabase as any)
        .from("sanitary_permit_applications")
        .insert({
          establishment_id: selectedEstablishment.id,
          user_id: user!.id,
          establishment_name: selectedEstablishment.business_name,
          business_type: selectedEstablishment.business_type,
          address: selectedEstablishment.address,
          barangay: selectedEstablishment.barangay,
          owner_name: selectedEstablishment.owner_name || userName || "Owner",
          contact_number: selectedEstablishment.contact_number,
          status: "application_submitted",
          order_of_payment_number: orderNum,
          is_provisional: isProvisional,
        })
        .select("id")
        .single();
      if (appErr) throw appErr;

      const basePath = `${user!.id}/sanitary_apps/${app.id}`;
      const upload = async (key: string, file: File): Promise<string | null> => {
        const ext = file.name.split(".").pop() || "pdf";
        const path = `${basePath}/${key}.${ext}`;
        const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
        if (error) throw error;
        return path;
      };

      const health_certificates_url = docFiles.health_certificates ? await upload("health_certificates", docFiles.health_certificates) : null;
      const water_analysis_url = docFiles.water_analysis ? await upload("water_analysis", docFiles.water_analysis) : null;
      const pest_control_url = docFiles.pest_control ? await upload("pest_control", docFiles.pest_control) : null;
      const business_permit_url = docFiles.business_permit ? await upload("business_permit", docFiles.business_permit) : null;
      const valid_id_url = docFiles.valid_id ? await upload("valid_id", docFiles.valid_id) : null;

      const { data: payment, error: payErr } = await (supabase as any)
        .from("payments")
        .insert({
          user_id: user!.id,
          payment_type: "Sanitary Permit Fee",
          amount: SANITARY_FEE,
          status: "pending",
          reference_number: orderNum,
          sanitary_application_id: app.id,
        })
        .select("id")
        .single();
      if (payErr) throw payErr;

      await supabase
        .from("sanitary_permit_applications")
        .update({
          payment_id: payment.id,
          health_certificates_url: health_certificates_url || undefined,
          water_analysis_url: water_analysis_url || undefined,
          pest_control_url: pest_control_url || undefined,
          business_permit_url: business_permit_url || undefined,
          valid_id_url: valid_id_url || undefined,
        })
        .eq("id", app.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_sanitary_applications"] });
      queryClient.invalidateQueries({ queryKey: ["citizen_payments"] });
      setOpen(false);
      setSelectedEstablishmentId("");
      setDocFiles({});
      toast.success("Application submitted. Order of Payment generated. Please pay the sanitary permit fee.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit = selectedEstablishmentId && docFiles.health_certificates && docFiles.water_analysis && docFiles.pest_control && docFiles.business_permit && docFiles.valid_id;

  const reinspectionMutation = useMutation({
    mutationFn: async (app: any) => {
      if (!reinspectionFile) throw new Error("Upload proof of correction");
      const path = `${user!.id}/sanitary_apps/${app.id}/reinspection_proof.${reinspectionFile.name.split(".").pop() || "pdf"}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, reinspectionFile, { upsert: true });
      if (upErr) throw upErr;
      await supabase
        .from("sanitary_permit_applications")
        .update({
          status: "reinspection_requested",
          reinspection_proof_url: path,
          reinspection_requested_at: new Date().toISOString(),
        })
        .eq("id", app.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_sanitary_applications"] });
      setReinspectionApp(null);
      setReinspectionFile(null);
      toast.success("Proof uploaded. Reinspection requested. Inspector will schedule another inspection.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const showNoRefund = applications.some(
    (a) =>
      ["application_submitted", "payment_confirmed", "inspection_scheduled", "inspection_completed", "correction_required", "reinspection_requested", "permit_approved", "permit_issued", "provisional_permit_issued"].indexOf(a.status) >= 0
  );

  const sixtyDaysFromNow = (() => { const d = new Date(); d.setDate(d.getDate() + 60); return d.toISOString().slice(0, 10); })();
  const expiringSoon = applications.filter((a) => a.status === "permit_issued" && a.permit_expiry_date && a.permit_expiry_date <= sixtyDaysFromNow);
  const showRenewalNotice = expiringSoon.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Sanitary Permit Applications</h1>
          <p className="text-sm text-muted-foreground">Apply for and track sanitary permits (Quezon City LGU process)</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setOpen(true)} disabled={establishments.length === 0}>
          <Plus className="h-4 w-4" /> Apply for Sanitary Permit
        </Button>
      </div>

      {establishments.length === 0 && (
        <Card className="glass-card border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Register and get your establishment verified first. Only <strong>Registered</strong> establishments can apply for a Sanitary Permit.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.href = "/citizen/establishments"}>
              Go to My Establishments
            </Button>
          </CardContent>
        </Card>
      )}

      {showNoRefund && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>No Refund Policy.</strong> As per Quezon City Health Department regulations, once the application status has reached &quot;Application Submitted&quot;, fees are non-refundable.
          </div>
        </div>
      )}

      {showRenewalNotice && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Permit expiring soon.</strong> Your sanitary permit(s) expire within 60 days. To renew: submit a new application with updated documents, pay the renewal fee, and schedule inspection if required.
            <ul className="list-disc pl-4 mt-1">
              {expiringSoon.map((a) => (
                <li key={a.id}>{a.establishment_name} — expires {a.permit_expiry_date}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">New Sanitary Permit Application</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Establishment (Registered) *</Label>
              <select
                className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedEstablishmentId}
                onChange={(e) => setSelectedEstablishmentId(e.target.value)}
              >
                <option value="">Select establishment</option>
                {establishments.map((e) => (
                  <option key={e.id} value={e.id}>{e.business_name}</option>
                ))}
              </select>
            </div>
            {selectedEstablishment && (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><Label className="text-xs">Establishment Name</Label><Input value={selectedEstablishment.business_name} disabled className="bg-muted" /></div>
                  <div><Label className="text-xs">Business Type</Label><Input value={selectedEstablishment.business_type || ""} disabled className="bg-muted" /></div>
                  <div className="col-span-2"><Label className="text-xs">Address</Label><Input value={selectedEstablishment.address || ""} disabled className="bg-muted" /></div>
                  <div><Label className="text-xs">Barangay</Label><Input value={selectedEstablishment.barangay || ""} disabled className="bg-muted" /></div>
                  <div><Label className="text-xs">Owner Name</Label><Input value={selectedEstablishment.owner_name || userName} disabled className="bg-muted" /></div>
                  <div className="col-span-2"><Label className="text-xs">Contact Number</Label><Input value={selectedEstablishment.contact_number || ""} disabled className="bg-muted" /></div>
                </div>
                <div className="text-xs font-medium mt-2">Required document uploads</div>
                {[
                  { key: "health_certificates", label: "Validated Health Certificates (all employees, managers, owners)" },
                  { key: "water_analysis", label: "Water Analysis Report (monthly/semi-annual per establishment type)" },
                  { key: "pest_control", label: "Pest Control Service Report" },
                  { key: "business_permit", label: "Valid Business Permit" },
                  { key: "valid_id", label: "Valid ID" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label className="text-xs">{label} *</Label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="mt-1 block w-full text-sm text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                      onChange={(e) => setDocFiles((f) => ({ ...f, [key]: e.target.files?.[0] }))}
                    />
                    {docFiles[key] && <span className="text-xs text-muted-foreground">{docFiles[key].name}</span>}
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="provisional" checked={isProvisional} onChange={(e) => setIsProvisional(e.target.checked)} />
                  <Label htmlFor="provisional" className="text-xs">Apply for Provisional Sanitary Permit (temporary operation while compliance is evaluated)</Label>
                </div>
                <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !canSubmit}>
                  {addMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedRecord && (
        <>
          <RecordDetailModal
            open={detailOpen}
            onOpenChange={setDetailOpen}
            title="Permit Application Details"
            fields={[
              { label: "Establishment", value: selectedRecord.establishment_name },
              { label: "Status", value: STATUS_LABELS[selectedRecord.status] || selectedRecord.status, isStatus: true },
              { label: "Order of Payment", value: selectedRecord.order_of_payment_number },
              ...(selectedRecord.status === "application_submitted" ? [{ label: "Payment", value: "Pay via QC Pay Easy, Landbank, or Over-the-counter at City Treasurer's Office. Staff will confirm after payment.", isStatus: false as const }] : []),
              { label: "Applied", value: new Date(selectedRecord.applied_at).toLocaleString() },
              { label: "Inspection Date", value: selectedRecord.inspection_scheduled_date || "—" },
              { label: "Permit Number", value: selectedRecord.permit_number || "—" },
              { label: "Permit Expiry", value: selectedRecord.permit_expiry_date || "—" },
              { label: "Correction Notes", value: selectedRecord.correction_notes || "—" },
            ]}
          />
          {selectedRecord.status === "correction_required" && (
            <Card className="glass-card border-amber-200 dark:border-amber-800">
              <CardHeader><CardTitle className="text-sm">Correction Required</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{selectedRecord.correction_notes}</p>
                <p className="text-xs">Fix the issues, then upload proof and request reinspection.</p>
                <Button size="sm" onClick={() => setReinspectionApp(selectedRecord)}>Upload proof & request reinspection</Button>
              </CardContent>
            </Card>
          )}
          {selectedRecord.status === "permit_issued" && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-sm">Digital Sanitary Permit</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">Permit Number</span><span className="font-mono">{selectedRecord.permit_number}</span>
                  <span className="text-muted-foreground">Establishment</span><span>{selectedRecord.establishment_name}</span>
                  <span className="text-muted-foreground">Owner</span><span>{selectedRecord.owner_name}</span>
                  <span className="text-muted-foreground">Address</span><span>{selectedRecord.address}, {selectedRecord.barangay}</span>
                  <span className="text-muted-foreground">Approval Date</span><span>{selectedRecord.permit_issued_at ? new Date(selectedRecord.permit_issued_at).toLocaleDateString() : "—"}</span>
                  <span className="text-muted-foreground">Expiry Date</span><span>{selectedRecord.permit_expiry_date}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => window.print()}>
                    <Printer className="h-3.5 w-3.5" /> Print
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(`<h1>Sanitary Permit</h1><p>Permit No: ${selectedRecord.permit_number}</p><p>Establishment: ${selectedRecord.establishment_name}</p><p>Owner: ${selectedRecord.owner_name}</p><p>Address: ${selectedRecord.address}, ${selectedRecord.barangay}</p><p>Valid until: ${selectedRecord.permit_expiry_date}</p>`); w.document.close(); w.print(); } }}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={!!reinspectionApp} onOpenChange={() => { setReinspectionApp(null); setReinspectionFile(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Reinspection</DialogTitle></DialogHeader>
          {reinspectionApp && (
            <div className="space-y-3">
              <p className="text-sm">Upload proof that corrections have been made. Inspector will schedule another inspection.</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                onChange={(e) => setReinspectionFile(e.target.files?.[0] || null)}
              />
              {reinspectionFile && <span className="text-xs text-muted-foreground">{reinspectionFile.name}</span>}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setReinspectionApp(null)}>Cancel</Button>
                <Button onClick={() => reinspectionMutation.mutate(reinspectionApp)} disabled={reinspectionMutation.isPending || !reinspectionFile}>
                  {reinspectionMutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by establishment, order #, or status..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
          </div>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No permit applications yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Establishment</TableHead>
                  <TableHead className="text-xs">Order of Payment</TableHead>
                  <TableHead className="text-xs">Applied</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRecord(a); setDetailOpen(true); }}>
                    <TableCell className="font-medium text-sm">{a.establishment_name}</TableCell>
                    <TableCell className="text-sm font-mono">{a.order_of_payment_number || "—"}</TableCell>
                    <TableCell className="text-sm">{new Date(a.applied_at).toLocaleDateString()}</TableCell>
                    <TableCell><StatusBadge status={STATUS_LABELS[a.status] || a.status} /></TableCell>
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

export default SanitaryPermitApplication;
