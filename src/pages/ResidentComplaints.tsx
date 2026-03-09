import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { Plus } from "lucide-react";

const mockComplaints = [
  { date: "2026-03-05", type: "Clogged Drain", location: "Purok 2", status: "in-progress" },
  { date: "2026-02-20", type: "Foul Odor", location: "Purok 2", status: "resolved" },
];

const ResidentComplaints = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold font-heading">My Complaints</h1>
        <p className="text-sm text-muted-foreground">Your filed sanitation complaints</p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> File Complaint</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">File a Complaint</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label className="text-xs">Type</Label><Input placeholder="e.g., Clogged Drain" /></div>
            <div><Label className="text-xs">Location</Label><Input placeholder="Purok, Barangay" /></div>
            <div><Label className="text-xs">Description</Label><Textarea rows={3} /></div>
            <Button className="w-full">Submit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    <Card className="glass-card">
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockComplaints.map((c, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm">{c.date}</TableCell>
                <TableCell className="text-sm">{c.type}</TableCell>
                <TableCell className="text-sm">{c.location}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

export default ResidentComplaints;
