import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import RecordDetailModal from "@/components/RecordDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Syringe, Calendar, CheckCircle, Clock, XCircle, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DateInputWithCalendar } from "@/components/DateInputWithCalendar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const PATIENT_TYPES = ["Child", "Adult", "Senior Citizen", "PWD"] as const;
const VACCINE_OPTIONS = ["BCG", "Hepatitis B", "Pentavalent", "OPV", "IPV", "PCV", "MMR", "COVID-19", "Flu", "Measles-Rubella", "Other"];

const VaccinationNutrition = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [form, setForm] = useState({
    patient_name: "",
    patient_type: "Child",
    age: "",
    vaccine: "",
    vaccination_date: "",
    notes: "",
  });
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

  const { data: schedules = [] } = useQuery({
    queryKey: ["vaccination_schedules"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("vaccination_schedules")
        .select("*")
        .gte("schedule_date", new Date().toISOString().slice(0, 10))
        .order("schedule_date", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: scheduleOpen,
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const vaccination_date = form.vaccination_date || new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("vaccinations").insert({
        child_name: form.patient_name,
        patient_name: form.patient_name,
        patient_type: form.patient_type,
        age: form.age || null,
        vaccine: form.vaccine,
        vaccination_date,
        status: "scheduled",
        bhw_name: null,
        recorded_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_vaccinations"] });
      setOpen(false);
      setForm({ patient_name: "", patient_type: "Child", age: "", vaccine: "", vaccination_date: "", notes: "" });
      toast.success("Vaccination appointment request submitted to vaccinations record.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const scheduled = vaccinations.filter((v) => (v.status || "").toLowerCase() === "scheduled");
  const completed = vaccinations.filter((v) => (v.status || "").toLowerCase() === "completed");
  const pending = vaccinations.filter((v) => (v.status || "").toLowerCase() === "pending");
  const cancelled = vaccinations.filter((v) => (v.status || "").toLowerCase() === "cancelled");

  const filtered = useMemo(() => {
    let list = vaccinations;
    const q = search.trim().toLowerCase();
    if (q) {
      const name = (v: any) => (v.patient_name || v.child_name || "").toLowerCase();
      list = list.filter(
        (v) =>
          name(v).includes(q) ||
          (v.vaccine || "").toLowerCase().includes(q) ||
          (v.status || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter && statusFilter !== "all") {
      list = list.filter((v) => (v.status || "").toLowerCase() === statusFilter.toLowerCase());
    }
    if (dateFilter) {
      list = list.filter((v) => (v.vaccination_date || "").startsWith(dateFilter));
    }
    return list;
  }, [vaccinations, search, statusFilter, dateFilter]);

  const displayName = (v: any) => v.patient_name || v.child_name || "—";
  const displayType = (v: any) => v.patient_type || "—";

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
              <div><Label className="text-xs">Patient Name</Label><Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} placeholder="Full name" /></div>
              <div>
                <Label className="text-xs">Patient Type</Label>
                <Select value={form.patient_type} onValueChange={(v) => setForm({ ...form, patient_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PATIENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Age (optional)</Label><Input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="e.g., 5 years" /></div>
              <div>
                <Label className="text-xs">Vaccine</Label>
                <Select value={form.vaccine} onValueChange={(v) => setForm({ ...form, vaccine: v })}>
                  <SelectTrigger><SelectValue placeholder="Select vaccine" /></SelectTrigger>
                  <SelectContent>
                    {VACCINE_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Preferred Date</Label>
                <DateInputWithCalendar value={form.vaccination_date} onChange={(e) => setForm({ ...form, vaccination_date: e.target.value })} className="mt-1" />
              </div>
              <div><Label className="text-xs">Notes (optional)</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={() => requestMutation.mutate()} disabled={requestMutation.isPending || !form.patient_name || !form.vaccine}>
                {requestMutation.isPending ? "Submitting..." : "Submit Vaccination Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1"><Calendar className="h-4 w-4" /> Vaccination Schedule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading text-sm">Upcoming Vaccination Schedules</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground">By barangay and health center. Date and time shown.</p>
            {!schedules.length ? (
              <p className="text-sm text-muted-foreground py-4">No upcoming schedules in the system. Check with your barangay health center.</p>
            ) : (
              <div className="space-y-3 mt-2">
                {schedules.map((s) => (
                  <Card key={s.id} className="p-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="font-medium">{s.vaccine}</span>
                      <span className="text-muted-foreground">{s.barangay}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.health_center_location || "Health Center"}</p>
                    <p className="text-xs font-medium mt-1">
                      {s.schedule_date} {s.schedule_time ? `· ${String(s.schedule_time).slice(0, 5)}` : ""}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Syringe className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{vaccinations.length}</p>
            <p className="text-xs text-muted-foreground">Total Records</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completed.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{scheduled.length}</p>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pending.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{cancelled.length}</p>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {selectedRecord && (
        <RecordDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Vaccination Record Details"
          fields={[
            { label: "Date", value: selectedRecord.vaccination_date },
            { label: "Vaccine", value: selectedRecord.vaccine },
            { label: "Patient Name", value: displayName(selectedRecord) },
            { label: "Patient Type", value: displayType(selectedRecord) },
            { label: "Age", value: selectedRecord.age ?? "—" },
            { label: "Status", value: selectedRecord.status, isStatus: true },
            { label: "Recorded", value: new Date(selectedRecord.created_at).toLocaleDateString() },
          ]}
        />
      )}

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input placeholder="Search by vaccine name..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[160px]"
              placeholder="Date"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No vaccination records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Vaccine</TableHead>
                  <TableHead className="text-xs">Patient Name</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Patient Type</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRecord(v); setDetailOpen(true); }}>
                    <TableCell className="text-sm">{v.vaccination_date}</TableCell>
                    <TableCell className="text-sm">{v.vaccine}</TableCell>
                    <TableCell className="text-sm">{displayName(v)}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{displayType(v)}</TableCell>
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
