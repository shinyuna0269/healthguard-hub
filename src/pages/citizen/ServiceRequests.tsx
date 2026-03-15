import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import RecordDetailModal from "@/components/RecordDetailModal";
import { DateInputWithCalendar } from "@/components/DateInputWithCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { QC_BARANGAYS } from "@/lib/constants";
import { FileText, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SERVICE_REQUEST_TYPES = [
  "Septic Tank Desludging",
  "Environmental Compliance Inspection",
  "Wastewater Treatment Inspection",
  "Sludge Disposal Monitoring",
  "Other Sanitation Service",
] as const;

const ServiceRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState({
    request_type: "" as string,
    location: "",
    barangay: "",
    description: "",
    preferred_schedule: "",
  });
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: requests = [] } = useQuery({
    queryKey: ["citizen_service_requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    let list = requests;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.title || "").toLowerCase().includes(q) ||
          (r.request_type || "").toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q) ||
          (r.status || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter && statusFilter !== "all") {
      list = list.filter((r) => (r.status || "").toLowerCase() === statusFilter.toLowerCase());
    }
    return list;
  }, [requests, search, statusFilter]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const refNum = `SR-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      let supporting_documents_url: string | null = null;
      if (supportingFile && user) {
        const path = `${user.id}/service_requests/${refNum.replace(/[^a-zA-Z0-9-]/g, "_")}.${supportingFile.name.split(".").pop() || "pdf"}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, supportingFile, { upsert: true });
        if (!upErr) supporting_documents_url = path;
      }

      if (form.request_type === "Septic Tank Desludging") {
        const { data: septic, error: septicErr } = await supabase
          .from("septic_desludging_requests")
          .insert({
            user_id: user!.id,
            property_address: form.location,
            barangay: form.barangay,
            preferred_date: form.preferred_schedule || null,
            property_details_url: supporting_documents_url,
            status: "pending",
            reference_number: refNum,
          })
          .select("id")
          .single();
        if (septicErr) throw septicErr;
        await supabase.from("service_requests").insert({
          user_id: user!.id,
          request_type: form.request_type,
          reference_id: septic.id,
          title: `${form.request_type} — ${form.location || form.barangay}`,
          description: form.description || null,
          status: "submitted",
        });
      } else {
        const { data: env, error: envErr } = await supabase
          .from("environmental_compliance_requests")
          .insert({
            user_id: user!.id,
            business_name: form.location || "N/A",
            request_type: form.request_type,
            address: form.description || null,
            barangay: form.barangay || null,
            location: form.location || null,
            description: form.description || null,
            preferred_schedule: form.preferred_schedule || null,
            supporting_documents_url,
            status: "pending",
          })
          .select("id")
          .single();
        if (envErr) throw envErr;
        await supabase.from("service_requests").insert({
          user_id: user!.id,
          request_type: form.request_type,
          reference_id: env.id,
          title: `${form.request_type} — ${form.location || form.barangay}`,
          description: form.description || null,
          status: "submitted",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_service_requests"] });
      setFormOpen(false);
      setForm({ request_type: "", location: "", barangay: "", description: "", preferred_schedule: "" });
      setSupportingFile(null);
      toast.success("Service request submitted. Track status here.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Service Requests</h1>
          <p className="text-sm text-muted-foreground">Submit and track sanitation service requests</p>
        </div>
        <Button size="sm" className="gap-1 shrink-0" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> New Request
        </Button>
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
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search by title, type, description, or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No service requests found.</p>
              <p className="text-xs text-muted-foreground mt-1">Submit a new request using the button above.</p>
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
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedRecord(r);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{r.request_type}</TableCell>
                    <TableCell className="font-medium text-sm">{r.title}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{r.description || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">New Service Request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Request Type *</Label>
              <Select
                value={form.request_type}
                onValueChange={(v) => setForm({ ...form, request_type: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_REQUEST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Location *</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Address or site location"
              />
            </div>
            <div>
              <Label className="text-xs">Barangay *</Label>
              <Select value={form.barangay} onValueChange={(v) => setForm({ ...form, barangay: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select barangay" />
                </SelectTrigger>
                <SelectContent>
                  {QC_BARANGAYS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the request or issue..."
              />
            </div>
            <div>
              <Label className="text-xs">Preferred Schedule</Label>
              <DateInputWithCalendar
                value={form.preferred_schedule}
                onChange={(e) => setForm({ ...form, preferred_schedule: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Upload Supporting Documents</Label>
              <input
                type="file"
                ref={fileRef}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setSupportingFile(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 w-full"
                onClick={() => fileRef.current?.click()}
              >
                {supportingFile ? supportingFile.name : "Choose file"}
              </Button>
            </div>
            <Button
              className="w-full"
              onClick={() => submitMutation.mutate()}
              disabled={
                submitMutation.isPending ||
                !form.request_type ||
                !form.location ||
                !form.barangay
              }
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceRequests;
