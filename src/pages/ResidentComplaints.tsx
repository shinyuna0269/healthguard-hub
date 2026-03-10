import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const ResidentComplaints = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ complaint_type: "", location: "", description: "" });
  const queryClient = useQueryClient();

  const { data: complaints = [] } = useQuery({
    queryKey: ["resident_complaints", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("resident_complaints").select("*").order("complaint_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("resident_complaints").insert({
        user_id: user!.id,
        complaint_type: form.complaint_type,
        location: form.location,
        description: form.description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident_complaints"] });
      setOpen(false);
      setForm({ complaint_type: "", location: "", description: "" });
      toast.success("Complaint filed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">My Complaints</h1>
          <p className="text-sm text-muted-foreground">Your filed sanitation complaints</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> File Complaint</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">File a Complaint</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label className="text-xs">Type</Label><Input placeholder="e.g., Clogged Drain" value={form.complaint_type} onChange={(e) => setForm({ ...form, complaint_type: e.target.value })} /></div>
              <div><Label className="text-xs">Location</Label><Input placeholder="Purok, Barangay" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label className="text-xs">Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.complaint_type}>
                {addMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="glass-card">
        <CardContent className="pt-6">
          {complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No complaints filed yet.</p>
          ) : (
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
                {complaints.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{c.complaint_date}</TableCell>
                    <TableCell className="text-sm">{c.complaint_type}</TableCell>
                    <TableCell className="text-sm">{c.location}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
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

export default ResidentComplaints;
