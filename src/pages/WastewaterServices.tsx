import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

const WastewaterServices = () => {
  const { currentRole } = useAuth();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ complaint_type: "", location: "", description: "" });
  const isResident = currentRole === "Resident_User";
  const queryClient = useQueryClient();

  const { data: complaints = [] } = useQuery({
    queryKey: ["wastewater_complaints"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wastewater_complaints").select("*").order("complaint_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("wastewater_complaints").insert({
        complainant: "Current User",
        complaint_type: form.complaint_type,
        location: form.location,
        description: form.description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wastewater_complaints"] });
      setOpen(false);
      setForm({ complaint_type: "", location: "", description: "" });
      toast.success("Complaint submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = complaints.filter(
    (c) => c.complainant.toLowerCase().includes(search.toLowerCase()) || c.complaint_type.toLowerCase().includes(search.toLowerCase())
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> File Complaint</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">New Sanitation Complaint</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label className="text-xs">Complaint Type</Label><Input placeholder="e.g., Clogged Drainage" value={form.complaint_type} onChange={(e) => setForm({ ...form, complaint_type: e.target.value })} /></div>
              <div><Label className="text-xs">Location</Label><Input placeholder="Purok, Barangay" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label className="text-xs">Description</Label><Textarea placeholder="Describe the issue..." rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.complaint_type}>
                {addMutation.isPending ? "Submitting..." : "Submit Complaint"}
              </Button>
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
                  <TableCell className="text-sm">{c.complaint_type}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{c.location}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{c.complaint_date}</TableCell>
                  {!isResident && <TableCell className="text-sm hidden lg:table-cell">{c.assigned_to}</TableCell>}
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
