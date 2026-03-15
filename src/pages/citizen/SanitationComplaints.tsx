import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import RecordDetailModal from "@/components/RecordDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { QC_BARANGAYS, SANITATION_COMPLAINT_TYPES } from "@/lib/constants";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const SanitationComplaints = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form, setForm] = useState({ complaint_type: "", barangay: "", description: "", photo_attachment: "" });
  const queryClient = useQueryClient();

  const { data: complaints = [] } = useQuery({
    queryKey: ["citizen_sanitation_complaints", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sanitation_complaints")
        .select("*")
        .eq("citizen_id", user!.id)
        .order("date_submitted", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("sanitation_complaints").insert({
        citizen_id: user!.id,
        complaint_type: form.complaint_type,
        barangay: form.barangay,
        description: form.description || null,
        photo_attachment: form.photo_attachment || null,
        status: "pending",
      }).select("complaint_id").single();
      if (error) throw error;
      await supabase.from("service_requests").insert({
        user_id: user!.id,
        request_type: "Sanitation Complaint",
        title: `Sanitation complaint — ${form.complaint_type}`,
        description: form.description || `Barangay: ${form.barangay}`,
        status: "Submitted",
        reference_id: data.complaint_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_sanitation_complaints"] });
      setOpen(false);
      setForm({ complaint_type: "", barangay: "", description: "", photo_attachment: "" });
      toast.success("Complaint filed. BHW and Sanitary Inspector have been notified.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Sanitation Complaints</h1>
          <p className="text-sm text-muted-foreground">Report and track sanitation complaints. Received by BHW and Sanitary Inspector.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Report Complaint</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">File a Sanitation Complaint</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label className="text-xs">Complaint Type</Label>
                <Select value={form.complaint_type} onValueChange={(v) => setForm({ ...form, complaint_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {SANITATION_COMPLAINT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Barangay (Quezon City)</Label>
                <Select value={form.barangay} onValueChange={(v) => setForm({ ...form, barangay: v })}>
                  <SelectTrigger><SelectValue placeholder="Select barangay" /></SelectTrigger>
                  <SelectContent>
                    {QC_BARANGAYS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue..." /></div>
              <div><Label className="text-xs">Photo URL (optional)</Label><Input placeholder="Link to photo if available" value={form.photo_attachment} onChange={e => setForm({ ...form, photo_attachment: e.target.value })} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.complaint_type || !form.barangay}>
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
            { label: "Barangay", value: selectedRecord.barangay },
            { label: "Description", value: selectedRecord.description },
            { label: "Status", value: selectedRecord.status, isStatus: true },
            { label: "Assigned Officer", value: selectedRecord.assigned_officer ?? "—" },
            { label: "Submitted", value: new Date(selectedRecord.created_at).toLocaleDateString() },
          ]}
        />
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">Complaint History</CardTitle></CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No complaints filed yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map(c => (
                  <TableRow key={c.complaint_id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRecord(c); setDetailOpen(true); }}>
                    <TableCell className="text-sm">{c.date_submitted}</TableCell>
                    <TableCell className="text-sm">{c.complaint_type}</TableCell>
                    <TableCell className="text-sm">{c.barangay}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
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

export default SanitationComplaints;
