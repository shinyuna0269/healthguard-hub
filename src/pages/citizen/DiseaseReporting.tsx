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
import { QC_BARANGAYS } from "@/lib/constants";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const DiseaseReporting = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form, setForm] = useState({ disease: "", location: "", details: "" });
  const queryClient = useQueryClient();

  const { data: cases = [] } = useQuery({
    queryKey: ["citizen_disease_reports", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("disease_reports").select("*").eq("reported_by", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).from("disease_reports").insert({
        disease: form.disease,
        patient_location: form.location,
        details: form.details,
        reported_by: user!.id,
        reporter: "Citizen Report",
        status: "Submitted",
      }).select("id").single();
      if (error) throw error;
      await supabase.from("service_requests").insert({
        user_id: user!.id,
        request_type: "Disease Report",
        title: `Disease report — ${form.disease}`,
        description: form.details || `Location: ${form.location}`,
        status: "Submitted",
        reference_id: data.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_disease_reports"] });
      setOpen(false);
      setForm({ disease: "", location: "", details: "" });
      toast.success("Disease report submitted. A BHW will verify the case.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Disease Reporting</h1>
          <p className="text-sm text-muted-foreground">Report disease cases and track your submissions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Report Case</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Report Disease Case</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label className="text-xs">Disease / Illness</Label><Input placeholder="e.g., Dengue, TB, Flu" value={form.disease} onChange={e => setForm({ ...form, disease: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Barangay (Quezon City)</Label>
                <Select value={form.location || ""} onValueChange={(v) => setForm({ ...form, location: v })}>
                  <SelectTrigger><SelectValue placeholder="Select barangay" /></SelectTrigger>
                  <SelectContent>
                    {QC_BARANGAYS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Details</Label><Textarea rows={3} placeholder="Describe the case..." value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.disease || !form.location}>
                {addMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedRecord && (
        <RecordDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Disease Report Details"
          fields={[
            { label: "Date", value: selectedRecord.case_date ?? (selectedRecord.created_at && new Date(selectedRecord.created_at).toLocaleDateString()) },
            { label: "Disease", value: selectedRecord.disease },
            { label: "Barangay", value: selectedRecord.patient_location },
            { label: "Details", value: selectedRecord.details },
            { label: "Status", value: selectedRecord.status, isStatus: true },
            { label: "Submitted", value: selectedRecord.created_at && new Date(selectedRecord.created_at).toLocaleDateString() },
          ]}
        />
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">My Submitted Reports</CardTitle></CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No disease reports submitted.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Disease</TableHead>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRecord(c); setDetailOpen(true); }}>
                    <TableCell className="text-sm">{c.case_date ?? (c.created_at && new Date(c.created_at).toLocaleDateString())}</TableCell>
                    <TableCell className="text-sm">{c.disease}</TableCell>
                    <TableCell className="text-sm">{c.patient_location}</TableCell>
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

export default DiseaseReporting;
