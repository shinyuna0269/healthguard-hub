import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Leaf, Plus, Search } from "lucide-react";
import { toast } from "sonner";

const REQUEST_TYPES = ["Environmental sanitation inspection", "Wastewater treatment verification", "Compliance certification"];

const EnvironmentalComplianceRequest = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ business_name: "", request_type: "", address: "", barangay: "" });
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["citizen_env_compliance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("environmental_compliance_requests")
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
        (r.business_name || "").toLowerCase().includes(q) ||
        (r.barangay || "").toLowerCase().includes(q) ||
        (r.request_type || "").toLowerCase().includes(q) ||
        (r.status || "").toLowerCase().includes(q)
    );
  }, [requests, search]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("environmental_compliance_requests").insert({
        user_id: user!.id,
        business_name: form.business_name,
        request_type: form.request_type,
        address: form.address || null,
        barangay: form.barangay || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_env_compliance"] });
      setOpen(false);
      setForm({ business_name: "", request_type: "", address: "", barangay: "" });
      toast.success("Environmental compliance request submitted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Environmental Compliance Request</h1>
          <p className="text-sm text-muted-foreground">Request inspection, wastewater verification, or compliance certification</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New Request
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by business name, barangay, type, or status..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <Leaf className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No compliance requests yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Business</TableHead>
                  <TableHead className="text-xs">Request Type</TableHead>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{r.business_name}</TableCell>
                    <TableCell className="text-sm">{r.request_type}</TableCell>
                    <TableCell className="text-sm">{r.barangay || "—"}</TableCell>
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
          <DialogHeader><DialogTitle className="font-heading">Environmental Compliance Request</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label className="text-xs">Business Name *</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Business or establishment name" /></div>
            <div>
              <Label className="text-xs">Request Type *</Label>
              <select className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.request_type} onChange={(e) => setForm({ ...form, request_type: e.target.value })}>
                <option value="">Select type</option>
                {REQUEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Business address" /></div>
            <div><Label className="text-xs">Barangay</Label><Input value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} placeholder="Barangay" /></div>
            <Button className="w-full" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !form.business_name || !form.request_type}>
              {submitMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnvironmentalComplianceRequest;
