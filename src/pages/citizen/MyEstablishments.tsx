import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import RecordDetailModal from "@/components/RecordDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Building2, Pencil, Trash2, Upload, Search } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_LABELS: Record<string, string> = {
  pending_verification: "Submitted",
  submitted: "Submitted",
  under_review: "Under Review",
  requires_correction: "Correction Required",
  inspection_scheduled: "Inspection Scheduled",
  inspection_completed: "Inspection Completed",
  registered: "Approved",
  approved: "Approved",
  certificate_issued: "Certificate Issued",
  completed: "Completed",
  rejected: "Rejected",
};

const MyEstablishments = () => {
  const { user, userName } = useAuth();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const emptyForm = {
    business_name: "",
    business_type: "",
    address: "",
    barangay: "",
    contact_number: "",
    business_permit_number: "",
    issuing_lgu: "",
    permit_expiry_date: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const permitInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const { data: establishments = [] } = useQuery({
    queryKey: ["citizen_establishments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("establishments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    let list = establishments;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          (e.business_name || "").toLowerCase().includes(q) ||
          (e.barangay || "").toLowerCase().includes(q) ||
          (e.business_permit_number || "").toLowerCase().includes(q) ||
          (STATUS_LABELS[e.status] || e.status || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter && statusFilter !== "all") {
      list = list.filter((e) => (e.status || "") === statusFilter);
    }
    if (dateFilter) {
      list = list.filter((e) => (e.created_at || "").slice(0, 7) === dateFilter);
    }
    return list;
  }, [establishments, search, statusFilter, dateFilter]);

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data: inserted, error: insertErr } = await supabase
        .from("establishments")
        .insert({
          user_id: user!.id,
          owner_name: userName || "Owner",
          business_name: form.business_name,
          business_type: form.business_type,
          address: form.address,
          barangay: form.barangay,
          contact_number: form.contact_number,
          business_permit_number: form.business_permit_number,
          issuing_lgu: form.issuing_lgu,
          permit_expiry_date: form.permit_expiry_date || null,
          status: "pending_verification",
        })
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      const establishmentId = inserted.id;

      if (permitFile) {
        const ext = permitFile.name.split(".").pop() || "pdf";
        const path = `${user!.id}/establishments/${establishmentId}/business_permit.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("documents").upload(path, permitFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        await supabase.from("establishments").update({ permit_document_url: path }).eq("id", establishmentId);
      }

      try {
        await (supabase as any).from("establishment_notifications").insert({ establishment_id: establishmentId });
      } catch {
        // table might not exist yet in dev
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_establishments"] });
      setOpen(false);
      setForm(emptyForm);
      setPermitFile(null);
      toast.success("Establishment registration submitted. Sanitation Inspector and Health Center Staff have been notified.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from("establishments").update({
        business_name: form.business_name,
        business_type: form.business_type,
        address: form.address,
        barangay: form.barangay,
        contact_number: form.contact_number,
        business_permit_number: form.business_permit_number,
        issuing_lgu: form.issuing_lgu,
        permit_expiry_date: form.permit_expiry_date || null,
        status: "pending_verification",
        reviewer_notes: null,
      }).eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_establishments"] });
      setEditOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success("Establishment resubmitted for verification");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("establishments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_establishments"] });
      toast.success("Establishment registration deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (e: any) => {
    setEditingId(e.id);
    setForm({
      business_name: e.business_name || "",
      business_type: e.business_type || "",
      address: e.address || "",
      barangay: e.barangay || "",
      contact_number: e.contact_number || "",
      business_permit_number: e.business_permit_number || "",
      issuing_lgu: e.issuing_lgu || "",
      permit_expiry_date: e.permit_expiry_date || "",
    });
    setEditOpen(true);
  };

  const openDetail = (e: any) => {
    setSelectedRecord(e);
    setDetailOpen(true);
  };

  const canEdit = (status: string) => status === "requires_correction";
  const canDelete = (status: string) => status === "pending_verification" || status === "submitted";

  const renderFormFields = () => (
    <div className="grid gap-3">
      <div><Label className="text-xs">Business Name *</Label><Input value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} /></div>
      <div><Label className="text-xs">Business Type</Label><Input placeholder="e.g., Food, Retail" value={form.business_type} onChange={e => setForm({ ...form, business_type: e.target.value })} /></div>
      <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
      <div><Label className="text-xs">Barangay</Label><Input value={form.barangay} onChange={e => setForm({ ...form, barangay: e.target.value })} /></div>
      <div><Label className="text-xs">Owner Name</Label><Input value={userName} disabled className="bg-muted" /></div>
      <div><Label className="text-xs">Contact Number</Label><Input value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} /></div>
      <div><Label className="text-xs">Business Permit Number</Label><Input value={form.business_permit_number} onChange={e => setForm({ ...form, business_permit_number: e.target.value })} /></div>
      <div><Label className="text-xs">Issuing LGU</Label><Input value={form.issuing_lgu} onChange={e => setForm({ ...form, issuing_lgu: e.target.value })} /></div>
      <div><Label className="text-xs">Business Permit Expiry Date</Label><Input type="date" value={form.permit_expiry_date} onChange={e => setForm({ ...form, permit_expiry_date: e.target.value })} /></div>
      <div>
        <Label className="text-xs">Upload Business Permit Copy *</Label>
        <input
          ref={permitInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => setPermitFile(e.target.files?.[0] || null)}
        />
        <Button type="button" variant="outline" size="sm" className="mt-1 gap-1 w-full" onClick={() => permitInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          {permitFile ? permitFile.name : "Choose file (PDF or image)"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">My Establishments</h1>
          <p className="text-sm text-muted-foreground">Register and manage your business establishments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Register Establishment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">Register New Establishment</DialogTitle></DialogHeader>
            {renderFormFields()}
            <p className="text-xs text-muted-foreground">After submission, Sanitation Office Staff will verify your registration.</p>
            <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.business_name}>
              {addMutation.isPending ? "Submitting..." : "Submit for Verification"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit & Resubmit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Edit & Resubmit Establishment</DialogTitle></DialogHeader>
          {renderFormFields()}
          <p className="text-xs text-muted-foreground">Correcting and resubmitting will send this back for review.</p>
          <Button className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !form.business_name}>
            {updateMutation.isPending ? "Resubmitting..." : "Resubmit for Verification"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      {selectedRecord && (
        <RecordDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Establishment Details"
          fields={[
            { label: "Business Name", value: selectedRecord.business_name },
            { label: "Business Type", value: selectedRecord.business_type },
            { label: "Owner", value: selectedRecord.owner_name },
            { label: "Address", value: selectedRecord.address },
            { label: "Barangay", value: selectedRecord.barangay },
            { label: "Contact Number", value: selectedRecord.contact_number },
            { label: "Business Permit #", value: selectedRecord.business_permit_number },
            { label: "Issuing LGU", value: selectedRecord.issuing_lgu },
            { label: "Permit Expiry", value: selectedRecord.permit_expiry_date },
            { label: "Status", value: STATUS_LABELS[selectedRecord.status] || selectedRecord.status, isStatus: true },
            { label: "Submitted", value: new Date(selectedRecord.created_at).toLocaleDateString() },
            { label: "Reviewer Notes", value: selectedRecord.reviewer_notes },
          ]}
        />
      )}

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input placeholder="Search by name, barangay, permit #, or status..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending_verification">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="requires_correction">Correction Required</SelectItem>
                <SelectItem value="inspection_scheduled">Inspection Scheduled</SelectItem>
                <SelectItem value="registered">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Input type="month" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-[160px]" />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No establishments registered yet.</p>
              <p className="text-xs text-muted-foreground">Click "Register Establishment" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Business Name</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Address</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Permit #</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(e => (
                  <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(e)}>
                    <TableCell className="font-medium text-sm">{e.business_name}</TableCell>
                    <TableCell className="text-sm">{e.business_type}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{e.address}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{e.business_permit_number}</TableCell>
                    <TableCell><StatusBadge status={STATUS_LABELS[e.status] || e.status} /></TableCell>
                    <TableCell onClick={ev => ev.stopPropagation()}>
                      <div className="flex gap-1">
                        {canEdit(e.status) && (
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => openEdit(e)}>
                            <Pencil className="h-3 w-3" /> Edit & Resubmit
                          </Button>
                        )}
                        {canDelete(e.status) && (
                          <Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive" onClick={() => deleteMutation.mutate(e.id)}>
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filtered.some(e => e.status === "requires_correction" && e.reviewer_notes) && (
            <div className="mt-4 space-y-2">
              {filtered.filter(e => e.reviewer_notes && e.status === "requires_correction").map(e => (
                <div key={e.id} className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-xs font-medium text-destructive">{e.business_name} — Correction Required:</p>
                  <p className="text-xs text-muted-foreground mt-1">{e.reviewer_notes}</p>
                  <Button variant="outline" size="sm" className="mt-2 gap-1 text-xs" onClick={() => openEdit(e)}>
                    <Pencil className="h-3 w-3" /> Edit & Resubmit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyEstablishments;
