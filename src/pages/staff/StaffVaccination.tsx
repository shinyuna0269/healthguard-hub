import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Syringe, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";

const StaffVaccination = () => {
  const [queueSearch, setQueueSearch] = useState("");
  const [recordsSearch, setRecordsSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [openRecord, setOpenRecord] = useState(false);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [formRecord, setFormRecord] = useState({
    child_name: "",
    patient_type: "Child",
    age: "",
    vaccine: "",
    vaccination_date: new Date().toISOString().split("T")[0],
  });
  const [formSchedule, setFormSchedule] = useState({
    barangay: "",
    vaccine: "",
    health_center_location: "",
    assigned_bhw: "",
    schedule_date: "",
    schedule_time: "08:00",
  });
  const queryClient = useQueryClient();

  const { data: vaccinations = [], isLoading: vaccinationsLoading } = useQuery({
    queryKey: ["staff_vaccinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vaccinations")
        .select("*")
        .order("vaccination_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ["staff_vaccination_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vaccination_schedules")
        .select("*")
        .order("schedule_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addRecordMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vaccinations").insert({
        child_name: formRecord.child_name,
        patient_name: formRecord.child_name,
        patient_type: formRecord.patient_type,
        age: formRecord.age || null,
        vaccine: formRecord.vaccine,
        vaccination_date: formRecord.vaccination_date || new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_vaccinations"] });
      setOpenRecord(false);
      setFormRecord({
        child_name: "",
        patient_type: "Child",
        age: "",
        vaccine: "",
        vaccination_date: new Date().toISOString().split("T")[0],
      });
      toast.success("Immunization record saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addScheduleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vaccination_schedules").insert({
        barangay: formSchedule.barangay,
        vaccine: formSchedule.vaccine,
        health_center_location: formSchedule.health_center_location || null,
        assigned_bhw: formSchedule.assigned_bhw || null,
        schedule_date: formSchedule.schedule_date,
        schedule_time: formSchedule.schedule_time || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_vaccination_schedules"] });
      setOpenSchedule(false);
      setFormSchedule({
        barangay: "",
        vaccine: "",
        health_center_location: "",
        assigned_bhw: "",
        schedule_date: "",
        schedule_time: "08:00",
      });
      toast.success("Schedule added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const today = new Date().toISOString().split("T")[0];
  const queueFiltered = useMemo(() => {
    const list = vaccinations.filter(
      (v) => v.vaccination_date === today || (v.status && String(v.status).toLowerCase() === "pending"),
    );
    if (!queueSearch.trim()) return list;
    const q = queueSearch.trim().toLowerCase();
    return list.filter(
      (v) =>
        (v.child_name || "").toLowerCase().includes(q) ||
        (v.vaccine || "").toLowerCase().includes(q),
    );
  }, [vaccinations, today, queueSearch]);

  const recordsFiltered = useMemo(() => {
    if (!recordsSearch.trim()) return vaccinations;
    const q = recordsSearch.trim().toLowerCase();
    return vaccinations.filter(
      (v) =>
        (v.child_name || "").toLowerCase().includes(q) ||
        (v.vaccine || "").toLowerCase().includes(q) ||
        (v.vaccination_date || "").toLowerCase().includes(q),
    );
  }, [vaccinations, recordsSearch]);

  const scheduleFiltered = useMemo(() => {
    if (!scheduleSearch.trim()) return schedules;
    const q = scheduleSearch.trim().toLowerCase();
    return schedules.filter(
      (s) =>
        (s.barangay || "").toLowerCase().includes(q) ||
        (s.vaccine || "").toLowerCase().includes(q) ||
        (s.health_center_location || "").toLowerCase().includes(q),
    );
  }, [schedules, scheduleSearch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Vaccination Services</h1>
        <p className="text-sm text-muted-foreground">
          Vaccination queue, immunization records, and scheduling
        </p>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Vaccination Queue</TabsTrigger>
          <TabsTrigger value="records">Immunization Records</TabsTrigger>
          <TabsTrigger value="scheduling">Vaccination Scheduling</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Syringe className="h-4 w-4 text-primary" /> Vaccination Queue
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient or vaccine..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  className="h-8 max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {vaccinationsLoading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
              ) : queueFiltered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No entries in queue for today. Add immunization records or check back later.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Patient</TableHead>
                      <TableHead className="text-xs">Vaccine</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queueFiltered.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium text-sm">{v.child_name || v.patient_name}</TableCell>
                        <TableCell className="text-sm">{v.vaccine}</TableCell>
                        <TableCell className="text-sm">{v.vaccination_date}</TableCell>
                        <TableCell>
                          <StatusBadge status={v.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Immunization Records
                </CardTitle>
                <Dialog open={openRecord} onOpenChange={setOpenRecord}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" /> Add Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-heading">Add Immunization Record</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Patient Name</Label>
                          <Input
                            placeholder="Full name"
                            value={formRecord.child_name}
                            onChange={(e) => setFormRecord({ ...formRecord, child_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Patient Type</Label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                            value={formRecord.patient_type}
                            onChange={(e) => setFormRecord({ ...formRecord, patient_type: e.target.value })}
                          >
                            <option value="Child">Child</option>
                            <option value="Adult">Adult</option>
                            <option value="Senior Citizen">Senior Citizen</option>
                            <option value="PWD">PWD</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Age</Label>
                          <Input
                            placeholder="e.g., 6 months"
                            value={formRecord.age}
                            onChange={(e) => setFormRecord({ ...formRecord, age: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Vaccine</Label>
                          <Input
                            placeholder="Vaccine name"
                            value={formRecord.vaccine}
                            onChange={(e) => setFormRecord({ ...formRecord, vaccine: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={formRecord.vaccination_date}
                          onChange={(e) => setFormRecord({ ...formRecord, vaccination_date: e.target.value })}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => addRecordMutation.mutate()}
                        disabled={addRecordMutation.isPending || !formRecord.child_name || !formRecord.vaccine}
                      >
                        {addRecordMutation.isPending ? "Saving..." : "Save Record"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, vaccine, or date..."
                  value={recordsSearch}
                  onChange={(e) => setRecordsSearch(e.target.value)}
                  className="h-8 max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {vaccinationsLoading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Patient</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Type</TableHead>
                      <TableHead className="text-xs">Vaccine</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordsFiltered.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium text-sm">{v.child_name || v.patient_name}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{v.patient_type || "—"}</TableCell>
                        <TableCell className="text-sm">{v.vaccine}</TableCell>
                        <TableCell className="text-sm">{v.vaccination_date}</TableCell>
                        <TableCell>
                          <StatusBadge status={v.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!vaccinationsLoading && recordsFiltered.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">No immunization records found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Vaccination Scheduling
                </CardTitle>
                <Dialog open={openSchedule} onOpenChange={setOpenSchedule}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" /> Add Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-heading">Add Vaccination Schedule</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Barangay</Label>
                          <Input
                            placeholder="Barangay"
                            value={formSchedule.barangay}
                            onChange={(e) => setFormSchedule({ ...formSchedule, barangay: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Vaccine</Label>
                          <Input
                            placeholder="Vaccine"
                            value={formSchedule.vaccine}
                            onChange={(e) => setFormSchedule({ ...formSchedule, vaccine: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Health Center Location</Label>
                        <Input
                          placeholder="Health center address"
                          value={formSchedule.health_center_location}
                          onChange={(e) =>
                            setFormSchedule({ ...formSchedule, health_center_location: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Assigned BHW</Label>
                        <Input
                          placeholder="BHW name"
                          value={formSchedule.assigned_bhw}
                          onChange={(e) => setFormSchedule({ ...formSchedule, assigned_bhw: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={formSchedule.schedule_date}
                            onChange={(e) => setFormSchedule({ ...formSchedule, schedule_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Time</Label>
                          <Input
                            type="time"
                            value={formSchedule.schedule_time}
                            onChange={(e) => setFormSchedule({ ...formSchedule, schedule_time: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => addScheduleMutation.mutate()}
                        disabled={
                          addScheduleMutation.isPending ||
                          !formSchedule.barangay ||
                          !formSchedule.vaccine ||
                          !formSchedule.schedule_date
                        }
                      >
                        {addScheduleMutation.isPending ? "Saving..." : "Add Schedule"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by barangay, vaccine, or location..."
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  className="h-8 max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {schedulesLoading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Barangay</TableHead>
                      <TableHead className="text-xs">Vaccine</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Location</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Time</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Assigned BHW</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduleFiltered.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-sm">{s.barangay}</TableCell>
                        <TableCell className="text-sm">{s.vaccine}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell truncate max-w-[160px]">
                          {s.health_center_location ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">{s.schedule_date}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">
                          {s.schedule_time ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{s.assigned_bhw ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!schedulesLoading && scheduleFiltered.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">No schedules found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffVaccination;
