import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import RecordDetailModal from "@/components/RecordDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Syringe, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const VaccinationNutrition = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form, setForm] = useState({ vaccine_type: "", preferred_date: "", preferred_center: "", notes: "" });
  const queryClient = useQueryClient();

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["citizen_vaccinations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("vaccinations").select("*").order("vaccination_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_requests").insert({
        user_id: user!.id,
        request_type: "Vaccination Appointment",
        title: `Vaccination request — ${form.vaccine_type || "Unspecified vaccine"}`,
        description: `Preferred date: ${form.preferred_date || "Any"}; Preferred health center: ${form.preferred_center || "Any"}${form.notes ? `; Notes: ${form.notes}` : ""}`,
        status: "Submitted",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_service_requests", user?.id] });
      setOpen(false);
      setForm({ vaccine_type: "", preferred_date: "", preferred_center: "", notes: "" });
      toast.success("Vaccination appointment request submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const scheduled = vaccinations.filter(v => v.status === "scheduled");
  const completed = vaccinations.filter(v => v.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Vaccination & Nutrition</h1>
        <p className="text-sm text-muted-foreground">Track vaccination records and nutrition monitoring</p>
      </div>
      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Syringe className="h-4 w-4" /> Request Vaccination Appointment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading text-sm">Request Vaccination Appointment</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label className="text-xs">Vaccine Type</Label><Input value={form.vaccine_type} onChange={(e) => setForm({ ...form, vaccine_type: e.target.value })} placeholder="e.g., Measles, COVID-19" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label className="text-xs">Preferred Date</Label><Input type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} /></div>
                <div><Label className="text-xs">Preferred Health Center</Label><Input value={form.preferred_center} onChange={(e) => setForm({ ...form, preferred_center: e.target.value })} placeholder="e.g., Barangay Health Center" /></div>
              </div>
              <div><Label className="text-xs">Notes (optional)</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={() => requestMutation.mutate()} disabled={requestMutation.isPending || !form.vaccine_type}>
                {requestMutation.isPending ? "Submitting..." : "Submit Vaccination Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="sm" className="gap-1"><Calendar className="h-4 w-4" /> Vaccination Schedule</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card"><CardContent className="pt-6 text-center"><Syringe className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{vaccinations.length}</p><p className="text-xs text-muted-foreground">Total Records</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-success">{completed.length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-warning">{scheduled.length}</p><p className="text-xs text-muted-foreground">Scheduled</p></CardContent></Card>
      </div>

      {selectedRecord && (
        <RecordDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Vaccination Record Details"
          fields={[
            { label: "Date", value: selectedRecord.vaccination_date },
            { label: "Vaccine", value: selectedRecord.vaccine },
            { label: "Child Name", value: selectedRecord.child_name },
            { label: "Age", value: selectedRecord.age },
            { label: "BHW Name", value: selectedRecord.bhw_name },
            { label: "Status", value: selectedRecord.status, isStatus: true },
            { label: "Recorded", value: new Date(selectedRecord.created_at).toLocaleDateString() },
          ]}
        />
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">Vaccination Records</CardTitle></CardHeader>
        <CardContent>
          {vaccinations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No vaccination records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Vaccine</TableHead>
                  <TableHead className="text-xs">Child</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">BHW</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vaccinations.map((v) => (
                  <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRecord(v); setDetailOpen(true); }}>
                    <TableCell className="text-sm">{v.vaccination_date}</TableCell>
                    <TableCell className="text-sm">{v.vaccine}</TableCell>
                    <TableCell className="text-sm">{v.child_name}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{v.bhw_name}</TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
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

export default VaccinationNutrition;
