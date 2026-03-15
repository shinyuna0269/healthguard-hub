import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import { DateInputWithCalendar } from "@/components/DateInputWithCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Droplets, Plus, Search } from "lucide-react";
import { toast } from "sonner";

const SepticDesludging = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ property_address: "", barangay: "", preferred_date: "" });
  const [propertyFile, setPropertyFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["citizen_septic_requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("septic_desludging_requests")
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
    if (!q) return requests;
    return requests.filter(
      (r) =>
        (r.property_address || "").toLowerCase().includes(q) ||
        (r.barangay || "").toLowerCase().includes(q) ||
        (r.reference_number || "").toLowerCase().includes(q) ||
        (r.status || "").toLowerCase().includes(q)
    );
  }, [requests, search]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const refNum = `SD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      let property_details_url: string | null = null;
      if (propertyFile && user) {
        const path = `${user.id}/septic/${refNum.replace(/[^a-zA-Z0-9-]/g, "_")}.${propertyFile.name.split(".").pop() || "pdf"}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, propertyFile, { upsert: true });
        if (!upErr) property_details_url = path;
      }
      const { error } = await supabase.from("septic_desludging_requests").insert({
        user_id: user!.id,
        property_address: form.property_address,
        barangay: form.barangay,
        preferred_date: form.preferred_date || null,
        property_details_url,
        status: "pending",
        reference_number: refNum,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_septic_requests"] });
      setOpen(false);
      setForm({ property_address: "", barangay: "", preferred_date: "" });
      setPropertyFile(null);
      toast.success("Septic tank desludging request submitted. Track status here.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Septic Tank Desludging Request</h1>
          <p className="text-sm text-muted-foreground">Submit and track desludging requests for your property</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Submit Request
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by address, barangay, reference #, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <Droplets className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No desludging requests yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Reference</TableHead>
                  <TableHead className="text-xs">Property Address</TableHead>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs">Preferred Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.reference_number || "—"}</TableCell>
                    <TableCell className="text-sm">{r.property_address}</TableCell>
                    <TableCell className="text-sm">{r.barangay}</TableCell>
                    <TableCell className="text-sm">{r.preferred_date || "—"}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Septic Tank Desludging Request</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label className="text-xs">Property Address *</Label><Input value={form.property_address} onChange={(e) => setForm({ ...form, property_address: e.target.value })} placeholder="Full address" /></div>
            <div><Label className="text-xs">Barangay *</Label><Input value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} placeholder="Barangay" /></div>
            <div><Label className="text-xs">Preferred Date</Label><DateInputWithCalendar value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} /></div>
            <div>
              <Label className="text-xs">Property details (optional)</Label>
              <input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setPropertyFile(e.target.files?.[0] || null)} />
              <Button type="button" variant="outline" size="sm" className="mt-1 w-full" onClick={() => fileRef.current?.click()}>{propertyFile ? propertyFile.name : "Upload file"}</Button>
            </div>
            <Button className="w-full" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !form.property_address || !form.barangay}>
              {submitMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SepticDesludging;
