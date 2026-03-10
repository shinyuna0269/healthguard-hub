import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye } from "lucide-react";
import { toast } from "sonner";

const HealthCenterServices = () => {
  const { currentRole } = useAuth();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patient_name: "", age: "", address: "", symptoms: "", diagnosis: "", medicine: "", notes: "" });
  const isCaptain = currentRole === "Captain_User";
  const queryClient = useQueryClient();

  const { data: consultations = [] } = useQuery({
    queryKey: ["consultations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("consultations").select("*").order("consultation_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("consultations").insert({
        patient_name: form.patient_name,
        age: parseInt(form.age) || null,
        address: form.address,
        symptoms: form.symptoms,
        diagnosis: form.diagnosis,
        medicine: form.medicine,
        notes: form.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      setOpen(false);
      setForm({ patient_name: "", age: "", address: "", symptoms: "", diagnosis: "", medicine: "", notes: "" });
      toast.success("Consultation saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = consultations.filter(
    (p) => p.patient_name.toLowerCase().includes(search.toLowerCase()) || (p.diagnosis || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Health Center Services</h1>
          <p className="text-sm text-muted-foreground">
            {isCaptain ? "Summary statistics and reports" : "Patient records and consultations"}
          </p>
        </div>
        {!isCaptain && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Consultation</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-heading">New Consultation</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Patient Name</Label><Input placeholder="Full name" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} /></div>
                  <div><Label className="text-xs">Age</Label><Input type="number" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
                </div>
                <div><Label className="text-xs">Address</Label><Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label className="text-xs">Symptoms</Label><Textarea placeholder="Describe symptoms..." rows={2} value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Diagnosis</Label><Input placeholder="Diagnosis" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></div>
                  <div><Label className="text-xs">Medicine Given</Label><Input placeholder="Medicine" value={form.medicine} onChange={(e) => setForm({ ...form, medicine: e.target.value })} /></div>
                </div>
                <div><Label className="text-xs">Notes</Label><Textarea placeholder="Additional notes..." rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.patient_name}>
                  {addMutation.isPending ? "Saving..." : "Save Consultation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patients or diagnosis..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Patient</TableHead>
                <TableHead className="text-xs">Age</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                {!isCaptain && <TableHead className="text-xs hidden lg:table-cell">Symptoms</TableHead>}
                <TableHead className="text-xs">Diagnosis</TableHead>
                {!isCaptain && <TableHead className="text-xs hidden md:table-cell">Medicine</TableHead>}
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{isCaptain ? "****" : p.patient_name}</TableCell>
                  <TableCell className="text-sm">{p.age}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{p.consultation_date}</TableCell>
                  {!isCaptain && <TableCell className="text-sm hidden lg:table-cell">{p.symptoms}</TableCell>}
                  <TableCell className="text-sm">{p.diagnosis}</TableCell>
                  {!isCaptain && <TableCell className="text-sm hidden md:table-cell">{p.medicine}</TableCell>}
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell>
                    {!isCaptain && (
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthCenterServices;
