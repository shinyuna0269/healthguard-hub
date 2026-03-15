import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Plus, Search } from "lucide-react";
import { toast } from "sonner";

const COMPLAINT_TYPES = ["Illegal wastewater discharge", "Industrial wastewater issues", "Sewer blockage"];

const WastewaterComplaint = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ complaint_type: "", location: "", description: "", barangay: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: complaints = [] } = useQuery({
    queryKey: ["citizen_wastewater_complaints", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("citizen_wastewater_complaints")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return complaints;
    return complaints.filter(
      (c) =>
        (c.location || "").toLowerCase().includes(q) ||
        (c.barangay || "").toLowerCase().includes(q) ||
        (c.complaint_type || "").toLowerCase().includes(q) ||
        (c.status || "").toLowerCase().includes(q)
    );
  }, [complaints, search]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      let photo_url: string | null = null;
      if (photoFile && user) {
        const path = `${user.id}/wastewater/${crypto.randomUUID().slice(0, 8)}.${photoFile.name.split(".").pop() || "jpg"}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, photoFile, { upsert: true });
        if (!upErr) photo_url = path;
      }
      const { error } = await supabase.from("citizen_wastewater_complaints").insert({
        user_id: user!.id,
        complaint_type: form.complaint_type,
        location: form.location,
        description: form.description || null,
        photo_url,
        barangay: form.barangay,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_wastewater_complaints"] });
      setOpen(false);
      setForm({ complaint_type: "", location: "", description: "", barangay: "" });
      setPhotoFile(null);
      toast.success("Wastewater complaint submitted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Wastewater Complaint</h1>
          <p className="text-sm text-muted-foreground">Report illegal discharge, industrial issues, or sewer blockage</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> File Complaint
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by location, barangay, type, or status..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No complaints filed yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{c.complaint_type}</TableCell>
                    <TableCell className="text-sm">{c.location}</TableCell>
                    <TableCell className="text-sm">{c.barangay}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Wastewater Complaint</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Complaint Type *</Label>
              <select className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.complaint_type} onChange={(e) => setForm({ ...form, complaint_type: e.target.value })}>
                <option value="">Select type</option>
                {COMPLAINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Location *</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Street, area" /></div>
            <div><Label className="text-xs">Barangay *</Label><Input value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} placeholder="Barangay" /></div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the issue..." /></div>
            <div>
              <Label className="text-xs">Photo (optional)</Label>
              <input type="file" ref={photoRef} accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
              <Button type="button" variant="outline" size="sm" className="mt-1 w-full" onClick={() => photoRef.current?.click()}>{photoFile ? photoFile.name : "Upload photo"}</Button>
            </div>
            <Button className="w-full" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !form.complaint_type || !form.location || !form.barangay}>
              {submitMutation.isPending ? "Submitting..." : "Submit Complaint"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WastewaterComplaint;
