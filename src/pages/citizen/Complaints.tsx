import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import RecordDetailModal from "@/components/RecordDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { QC_BARANGAYS, COMPLAINT_TYPES } from "@/lib/constants";
import { MessageSquare, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { safeRandomId } from "@/lib/safeId";

const Complaints = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState({
    complaint_type: "",
    location: "",
    barangay: "",
    description: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const { data: complaints = [] } = useQuery({
    queryKey: ["citizen_complaints", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sanitation_complaints")
        .select("*")
        .eq("citizen_id", user!.id)
        .order("date_submitted", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    let list = complaints;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          (c.complaint_type || "").toLowerCase().includes(q) ||
          (c.barangay || "").toLowerCase().includes(q) ||
          (c.barangay || "").toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q) ||
          (c.status || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter && statusFilter !== "all") {
      list = list.filter((c) => (c.status || "").toLowerCase() === statusFilter.toLowerCase());
    }
    return list;
  }, [complaints, search, statusFilter]);

  const addMutation = useMutation({
    mutationFn: async () => {
      let photo_attachment: string | null = null;
      if (photoFile && user) {
        const path = `${user.id}/complaints/${safeRandomId("").slice(0, 8)}.${photoFile.name.split(".").pop() || "jpg"}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, photoFile, { upsert: true });
        if (!upErr) photo_attachment = path;
      }
      const { data, error } = await (supabase as any)
        .from("sanitation_complaints")
        .insert({
          citizen_id: user!.id,
          complaint_type: form.complaint_type,
          barangay: form.barangay,
          description: form.description || null,
          photo_attachment,
          status: "pending",
        })
        .select("complaint_id")
        .single();
      if (error) throw error;
      await supabase.from("service_requests").insert({
        user_id: user!.id,
        request_type: "Complaint",
        title: `Complaint — ${form.complaint_type}`,
        description: form.description || `Location: ${form.location || form.barangay}`,
        status: "Submitted",
        reference_id: data.complaint_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_complaints"] });
      setOpen(false);
      setForm({ complaint_type: "", location: "", barangay: "", description: "" });
      setPhotoFile(null);
      toast.success("Complaint filed. BHW and Sanitary Inspector have been notified.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Complaints</h1>
          <p className="text-sm text-muted-foreground">Report and track sanitation and environmental complaints.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 shrink-0">
              <Plus className="h-4 w-4" /> Report Complaint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">File a Complaint</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label className="text-xs">Complaint Type *</Label>
                <Select value={form.complaint_type} onValueChange={(v) => setForm({ ...form, complaint_type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_TYPES.map((t) => (
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
                  placeholder="Street, area, or landmark"
                />
              </div>
              <div>
                <Label className="text-xs">Barangay (Quezon City) *</Label>
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
                  placeholder="Describe the issue..."
                />
              </div>
              <div>
                <Label className="text-xs">Photo (optional)</Label>
                <input
                  type="file"
                  ref={photoRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 w-full"
                  onClick={() => photoRef.current?.click()}
                >
                  {photoFile ? photoFile.name : "Upload photo"}
                </Button>
              </div>
              <Button
                className="w-full"
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !form.complaint_type || !form.location || !form.barangay}
              >
                {addMutation.isPending ? "Submitting..." : "Submit Complaint"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedRecord && (
        <RecordDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Complaint Details"
          fields={[
            { label: "Date", value: selectedRecord.date_submitted },
            { label: "Type", value: selectedRecord.complaint_type },
            { label: "Location", value: selectedRecord.location ?? "—" },
            { label: "Barangay", value: selectedRecord.barangay },
            { label: "Description", value: selectedRecord.description ?? "—" },
            { label: "Status", value: selectedRecord.status, isStatus: true },
            { label: "Submitted", value: new Date(selectedRecord.created_at).toLocaleDateString() },
          ]}
        />
      )}

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search by type, location, barangay, or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No complaints filed yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.complaint_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedRecord(c);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell className="text-sm">{c.date_submitted}</TableCell>
                    <TableCell className="text-sm">{c.complaint_type}</TableCell>
                    <TableCell className="text-sm">{c.barangay ?? "—"}</TableCell>
                    <TableCell className="text-sm">{c.barangay}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
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

export default Complaints;
