import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Syringe, Baby, Weight, Calendar } from "lucide-react";
import { toast } from "sonner";

const suggestedSchedule = [
  { week: "Week 1 (Mar 10-14)", purok: "Purok 5", children: 15 },
  { week: "Week 2 (Mar 17-21)", purok: "Purok 3", children: 12 },
  { week: "Week 3 (Mar 24-28)", purok: "Purok 1", children: 8 },
];

const ImmunizationTracker = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ child_name: "", age: "", vaccine: "", vaccination_date: "" });
  const queryClient = useQueryClient();

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["vaccinations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vaccinations").select("*").order("vaccination_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: nutritionRecords = [] } = useQuery({
    queryKey: ["nutrition_records"],
    queryFn: async () => {
      const { data, error } = await supabase.from("nutrition_records").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vaccinations").insert({
        child_name: form.child_name,
        age: form.age,
        vaccine: form.vaccine,
        vaccination_date: form.vaccination_date || new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccinations"] });
      setOpen(false);
      setForm({ child_name: "", age: "", vaccine: "", vaccination_date: "" });
      toast.success("Record saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Immunization & Nutrition Tracker</h1>
          <p className="text-sm text-muted-foreground">Vaccination records, nutrition monitoring, and scheduling</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Record</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Add Immunization Record</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Child Name</Label><Input placeholder="Full name" value={form.child_name} onChange={(e) => setForm({ ...form, child_name: e.target.value })} /></div>
                <div><Label className="text-xs">Age</Label><Input placeholder="e.g., 6 months" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
              </div>
              <div><Label className="text-xs">Vaccine</Label><Input placeholder="Vaccine name" value={form.vaccine} onChange={(e) => setForm({ ...form, vaccine: e.target.value })} /></div>
              <div><Label className="text-xs">Date</Label><Input type="date" value={form.vaccination_date} onChange={(e) => setForm({ ...form, vaccination_date: e.target.value })} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.child_name || !form.vaccine}>
                {addMutation.isPending ? "Saving..." : "Save Record"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Vaccinations" value={String(vaccinations.length)} icon={Syringe} />
        <StatCard title="Children Monitored" value={String(nutritionRecords.length)} icon={Baby} />
        <StatCard title="Underweight Cases" value={String(nutritionRecords.filter(n => n.status === "Underweight").length)} icon={Weight} description="Requires follow-up" />
      </div>

      <Tabs defaultValue="vaccination">
        <TabsList>
          <TabsTrigger value="vaccination">Vaccinations</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="schedule">Op. Timbang Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="vaccination">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 max-w-sm" />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Child</TableHead>
                    <TableHead className="text-xs">Age</TableHead>
                    <TableHead className="text-xs">Vaccine</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">BHW</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccinations.filter(v => v.child_name.toLowerCase().includes(search.toLowerCase())).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium text-sm">{v.child_name}</TableCell>
                      <TableCell className="text-sm">{v.age}</TableCell>
                      <TableCell className="text-sm">{v.vaccine}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{v.vaccination_date}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{v.bhw_name}</TableCell>
                      <TableCell><StatusBadge status={v.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Child</TableHead>
                    <TableHead className="text-xs">Age</TableHead>
                    <TableHead className="text-xs">Weight</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Height</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Purok</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nutritionRecords.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium text-sm">{n.child_name}</TableCell>
                      <TableCell className="text-sm">{n.age}</TableCell>
                      <TableCell className="text-sm">{n.weight}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{n.height}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{n.purok}</TableCell>
                      <TableCell>
                        <StatusBadge status={n.status === "Normal" ? "compliant" : "non-compliant"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Operation Timbang — Suggested Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestedSchedule.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{s.week}</p>
                      <p className="text-xs text-muted-foreground">{s.purok} — {s.children} children due for weight monitoring</p>
                    </div>
                    <Button size="sm" variant="outline">Confirm</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImmunizationTracker;
