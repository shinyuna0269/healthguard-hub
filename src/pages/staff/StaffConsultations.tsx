import { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import RecordDetailModal, { type DetailField } from "@/components/RecordDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye } from "lucide-react";
import { toast } from "sonner";

const StaffConsultations = () => {
  const location = useLocation();
  const statePatient = (location.state as any)?.patient_name ?? "";
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchBarangay, setSearchBarangay] = useState("");
  const [searchDiagnosis, setSearchDiagnosis] = useState("");
  const [open, setOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<any | null>(null);
  const [form, setForm] = useState({
    patient_name: "",
    age: "",
    address: "",
    symptoms: "",
    diagnosis: "",
    medicine: "",
    notes: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (statePatient && typeof statePatient === "string") {
      setForm((f) => ({ ...f, patient_name: statePatient }));
    }
  }, [statePatient]);

  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ["staff_consultations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .order("consultation_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("consultations").insert({
        patient_name: form.patient_name,
        age: form.age ? parseInt(form.age, 10) : null,
        address: form.address || null,
        symptoms: form.symptoms || null,
        diagnosis: form.diagnosis || null,
        medicine: form.medicine || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_consultations"] });
      setOpen(false);
      setForm({
        patient_name: "",
        age: "",
        address: "",
        symptoms: "",
        diagnosis: "",
        medicine: "",
        notes: "",
      });
      toast.success("Consultation saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return consultations.filter((p) => {
      if (searchName.trim() && !(p.patient_name || "").toLowerCase().includes(searchName.trim().toLowerCase()))
        return false;
      if (searchDate && p.consultation_date !== searchDate) return false;
      if (searchBarangay.trim() && !(p.address || "").toLowerCase().includes(searchBarangay.trim().toLowerCase()))
        return false;
      if (searchDiagnosis.trim() && !(p.diagnosis || "").toLowerCase().includes(searchDiagnosis.trim().toLowerCase()))
        return false;
      return true;
    });
  }, [consultations, searchName, searchDate, searchBarangay, searchDiagnosis]);

  const detailFields = (row: any): DetailField[] => [
    { label: "Patient Name", value: row.patient_name },
    { label: "Age", value: row.age },
    { label: "Address", value: row.address },
    { label: "Date", value: row.consultation_date },
    { label: "Symptoms", value: row.symptoms },
    { label: "Diagnosis", value: row.diagnosis },
    { label: "Medicine", value: row.medicine },
    { label: "Notes", value: row.notes },
    { label: "Status", value: row.status, isStatus: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Consultations</h1>
          <p className="text-sm text-muted-foreground">Add new consultations and view records</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> New Consultation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Consultation Form</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Patient Name</Label>
                  <Input
                    placeholder="Full name"
                    value={form.patient_name}
                    onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Age</Label>
                  <Input
                    type="number"
                    placeholder="Age"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Input
                  placeholder="Address / Barangay"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Symptoms</Label>
                <Textarea
                  placeholder="Describe symptoms..."
                  rows={2}
                  value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Diagnosis</Label>
                  <Input
                    placeholder="Diagnosis"
                    value={form.diagnosis}
                    onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Medicine Given</Label>
                  <Input
                    placeholder="Medicine"
                    value={form.medicine}
                    onChange={(e) => setForm({ ...form, medicine: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !form.patient_name}
              >
                {addMutation.isPending ? "Saving..." : "Save Consultation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading mb-3">Consultation Records</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Citizen name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="h-8 w-36"
              />
            </div>
            <Input
              type="date"
              placeholder="Date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="h-8 w-36"
            />
            <Input
              placeholder="Barangay / address"
              value={searchBarangay}
              onChange={(e) => setSearchBarangay(e.target.value)}
              className="h-8 w-40"
            />
            <Input
              placeholder="Diagnosis"
              value={searchDiagnosis}
              onChange={(e) => setSearchDiagnosis(e.target.value)}
              className="h-8 w-36"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading records...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Patient</TableHead>
                  <TableHead className="text-xs">Age</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Address</TableHead>
                  <TableHead className="text-xs">Diagnosis</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">{p.patient_name}</TableCell>
                    <TableCell className="text-sm">{p.age ?? "—"}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{p.consultation_date}</TableCell>
                    <TableCell className="text-sm hidden lg:table-cell truncate max-w-[140px]">{p.address ?? "—"}</TableCell>
                    <TableCell className="text-sm">{p.diagnosis ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDetailRow(p)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No consultation records found.</p>
          )}
        </CardContent>
      </Card>

      <RecordDetailModal
        open={!!detailRow}
        onOpenChange={(open) => !open && setDetailRow(null)}
        title="Consultation Details"
        fields={detailRow ? detailFields(detailRow) : []}
      />
    </div>
  );
};

export default StaffConsultations;
