import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const weeklyTrend = [
  { week: "W1", dengue: 2, flu: 8, tb: 1 },
  { week: "W2", dengue: 3, flu: 5, tb: 2 },
  { week: "W3", dengue: 5, flu: 12, tb: 1 },
  { week: "W4", dengue: 4, flu: 6, tb: 0 },
];

const StaffSurveillance = () => {
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterDisease, setFilterDisease] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    disease: "",
    case_count: "",
    case_date: "",
    patient_location: "",
    details: "",
  });
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["staff_surveillance_cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveillance_cases")
        .select("*")
        .order("case_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("surveillance_cases").insert({
        disease: form.disease,
        case_count: parseInt(form.case_count) || 1,
        case_date: form.case_date || new Date().toISOString().split("T")[0],
        patient_location: form.patient_location,
        details: form.details,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_surveillance_cases"] });
      setOpen(false);
      setForm({
        disease: "",
        case_count: "",
        case_date: "",
        patient_location: "",
        details: "",
      });
      toast.success("Case reported");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (
        filterBarangay.trim() &&
        !(c.patient_location || "").toLowerCase().includes(filterBarangay.trim().toLowerCase())
      )
        return false;
      if (
        filterDisease.trim() &&
        !(c.disease || "").toLowerCase().includes(filterDisease.trim().toLowerCase())
      )
        return false;
      if (filterDate && c.case_date !== filterDate) return false;
      return true;
    });
  }, [cases, filterBarangay, filterDisease, filterDate]);

  const activeCases = cases.filter((c) => c.status === "active");
  const resolvedCases = cases.filter((c) => c.status === "resolved");
  const diseaseBarData = Object.entries(
    cases.reduce((acc: Record<string, number>, c) => {
      acc[c.disease] = (acc[c.disease] || 0) + c.case_count;
      return acc;
    }, {}),
  ).map(([disease, count]) => ({ disease, cases: count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Disease Surveillance</h1>
          <p className="text-sm text-muted-foreground">
            Report disease cases and monitor by barangay, disease type, and date
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Report Disease Case
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Disease Case Reporting Form</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label className="text-xs">Disease</Label>
                <Input
                  placeholder="e.g., Dengue"
                  value={form.disease}
                  onChange={(e) => setForm({ ...form, disease: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Number of Cases</Label>
                  <Input
                    type="number"
                    value={form.case_count}
                    onChange={(e) => setForm({ ...form, case_count: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={form.case_date}
                    onChange={(e) => setForm({ ...form, case_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Location (Barangay / Purok)</Label>
                <Input
                  placeholder="Purok, Barangay"
                  value={form.patient_location}
                  onChange={(e) => setForm({ ...form, patient_location: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Details</Label>
                <Textarea
                  rows={2}
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !form.disease}
              >
                {addMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Cases"
          value={String(activeCases.reduce((s, c) => s + c.case_count, 0))}
          icon={AlertTriangle}
        />
        <StatCard title="Cases This Month" value={String(cases.length)} icon={Activity} />
        <StatCard title="Resolved This Month" value={String(resolvedCases.length)} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-heading">Weekly Disease Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="dengue" stroke="hsl(var(--chart-red))" strokeWidth={2} />
                <Line type="monotone" dataKey="flu" stroke="hsl(var(--chart-blue))" strokeWidth={2} />
                <Line type="monotone" dataKey="tb" stroke="hsl(var(--chart-orange))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-heading">Cases by Disease</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={diseaseBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="disease" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading">Disease Monitoring Table</CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Barangay / location"
              value={filterBarangay}
              onChange={(e) => setFilterBarangay(e.target.value)}
              className="h-8 w-40"
            />
            <Input
              placeholder="Disease type"
              value={filterDisease}
              onChange={(e) => setFilterDisease(e.target.value)}
              className="h-8 w-36"
            />
            <Input
              type="date"
              placeholder="Date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="h-8 w-36"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Disease</TableHead>
                  <TableHead className="text-xs">Location / Barangay</TableHead>
                  <TableHead className="text-xs">Cases</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Reporter</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{c.disease}</TableCell>
                    <TableCell className="text-sm">{c.patient_location ?? "—"}</TableCell>
                    <TableCell className="text-sm">{c.case_count}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{c.case_date}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{c.reporter ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && filteredCases.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No disease cases found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffSurveillance;
