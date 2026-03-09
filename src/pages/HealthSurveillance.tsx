import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { useRole } from "@/contexts/RoleContext";
import { Plus, Search, Activity, AlertTriangle, FileText, TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";

const mockCases = [
  { id: 1, disease: "Dengue", patient: "Purok 3 Cluster", cases: 5, date: "2026-03-07", status: "active", reporter: "BHW Cruz" },
  { id: 2, disease: "Tuberculosis", patient: "Individual", cases: 1, date: "2026-03-06", status: "active", reporter: "BHW Lim" },
  { id: 3, disease: "Influenza", patient: "Purok 1 Cluster", cases: 12, date: "2026-03-04", status: "resolved", reporter: "BHW Santos" },
  { id: 4, disease: "COVID-19", patient: "Individual", cases: 2, date: "2026-03-02", status: "active", reporter: "BHW Cruz" },
  { id: 5, disease: "Measles", patient: "Purok 5", cases: 3, date: "2026-02-28", status: "resolved", reporter: "BHW Lim" },
];

const weeklyTrend = [
  { week: "W1", dengue: 2, flu: 8, tb: 1 },
  { week: "W2", dengue: 3, flu: 5, tb: 2 },
  { week: "W3", dengue: 5, flu: 12, tb: 1 },
  { week: "W4", dengue: 4, flu: 6, tb: 0 },
];

const HealthSurveillance = () => {
  const { currentRole } = useRole();
  const [search, setSearch] = useState("");
  const isBHW = currentRole === "BHW_User";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Health Surveillance System</h1>
          <p className="text-sm text-muted-foreground">Disease case reporting and public health monitoring</p>
        </div>
        <div className="flex gap-2">
          {(currentRole === "Clerk_User" || currentRole === "Captain_User" || currentRole === "SysAdmin_User") && (
            <Button size="sm" variant="outline" className="gap-1">
              <FileText className="h-4 w-4" /> Generate Monthly Report
            </Button>
          )}
          {(isBHW || currentRole === "Clerk_User") && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Report Case</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-heading">Report Disease Case</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label className="text-xs">Disease</Label><Input placeholder="e.g., Dengue" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Number of Cases</Label><Input type="number" /></div>
                    <div><Label className="text-xs">Date</Label><Input type="date" /></div>
                  </div>
                  <div><Label className="text-xs">Location</Label><Input placeholder="Purok, Barangay" /></div>
                  <div><Label className="text-xs">Details</Label><Textarea rows={2} /></div>
                  <Button className="w-full">Submit Report</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Active Cases" value="47" icon={AlertTriangle} trend={{ value: -8, label: "vs last week" }} />
        <StatCard title="Cases This Month" value="23" icon={Activity} />
        <StatCard title="Resolved This Month" value="15" icon={TrendingUp} trend={{ value: 12, label: "resolution rate" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm font-heading">Weekly Disease Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="dengue" stroke="hsl(var(--chart-red))" strokeWidth={2} />
                <Line type="monotone" dataKey="flu" stroke="hsl(var(--chart-blue))" strokeWidth={2} />
                <Line type="monotone" dataKey="tb" stroke="hsl(var(--chart-orange))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm font-heading">Cases by Disease</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { disease: "Dengue", cases: 14 },
                { disease: "TB", cases: 8 },
                { disease: "Flu", cases: 31 },
                { disease: "COVID", cases: 5 },
                { disease: "Measles", cases: 3 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="disease" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search cases..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Disease</TableHead>
                <TableHead className="text-xs">Patient/Location</TableHead>
                <TableHead className="text-xs">Cases</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Reporter</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-sm">{c.disease}</TableCell>
                  <TableCell className="text-sm">{c.patient}</TableCell>
                  <TableCell className="text-sm">{c.cases}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{c.date}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{c.reporter}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthSurveillance;
