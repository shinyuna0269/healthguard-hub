import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { useRole } from "@/contexts/RoleContext";
import { Plus, Search, Droplets } from "lucide-react";

const mockComplaints = [
  { id: 1, complainant: "Roberto Cruz", type: "Clogged Drainage", location: "Purok 3, Brgy. San Jose", date: "2026-03-07", status: "pending", assigned: "—" },
  { id: 2, complainant: "Elena Diaz", type: "Septic Overflow", location: "Purok 1, Brgy. Poblacion", date: "2026-03-06", status: "in-progress", assigned: "BSI Ramos" },
  { id: 3, complainant: "Mario Santos", type: "Illegal Dumping", location: "Purok 5, Brgy. Mabini", date: "2026-03-04", status: "resolved", assigned: "BSI Santos" },
  { id: 4, complainant: "Liza Tan", type: "Standing Water", location: "Purok 2, Brgy. Rizal", date: "2026-03-03", status: "scheduled", assigned: "BSI Ramos" },
  { id: 5, complainant: "Andres Reyes", type: "Foul Odor", location: "Purok 4, Brgy. San Jose", date: "2026-03-01", status: "completed", assigned: "BSI Santos" },
];

const WastewaterServices = () => {
  const { currentRole } = useRole();
  const [search, setSearch] = useState("");
  const isResident = currentRole === "Resident_User";

  const filtered = mockComplaints.filter(
    (c) => c.complainant.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Wastewater & Septic Services</h1>
          <p className="text-sm text-muted-foreground">
            {isResident ? "Submit and track sanitation complaints" : "Complaint management and service tracking"}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> File Complaint</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">New Sanitation Complaint</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label className="text-xs">Complaint Type</Label><Input placeholder="e.g., Clogged Drainage" /></div>
              <div><Label className="text-xs">Location</Label><Input placeholder="Purok, Barangay" /></div>
              <div><Label className="text-xs">Description</Label><Textarea placeholder="Describe the issue..." rows={3} /></div>
              <Button className="w-full">Submit Complaint</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search complaints..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Complainant</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Location</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                {!isResident && <TableHead className="text-xs hidden lg:table-cell">Assigned</TableHead>}
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-sm">{c.complainant}</TableCell>
                  <TableCell className="text-sm">{c.type}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{c.location}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{c.date}</TableCell>
                  {!isResident && <TableCell className="text-sm hidden lg:table-cell">{c.assigned}</TableCell>}
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

export default WastewaterServices;
