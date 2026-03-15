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
import { Waves, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeRandomId } from "@/lib/safeId";

const REPORT_TYPES = ["Polluted waterway", "Clogged drainage", "Garbage dumping in rivers"];

const WaterwayCleanupReport = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [form, setForm] = useState({ report_type: "", location: "", description: "", barangay: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ["citizen_waterway_reports", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("waterway_cleanup_reports")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    let list = reports;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.location || "").toLowerCase().includes(q) ||
          (r.barangay || "").toLowerCase().includes(q) ||
          (r.report_type || "").toLowerCase().includes(q) ||
          (r.status || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter && statusFilter !== "all") {
      list = list.filter((r) => (r.status || "").toLowerCase() === statusFilter.toLowerCase());
    }
    if (dateFilter) {
      list = list.filter((r) => (r.created_at || "").slice(0, 7) === dateFilter);
    }
    return list;
  }, [reports, search, statusFilter, dateFilter]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      let photo_url: string | null = null;
      if (photoFile && user) {
        const path = `${user.id}/waterway/${safeRandomId("").slice(0, 8)}.${photoFile.name.split(".").pop() || "jpg"}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, photoFile, { upsert: true });
        if (!upErr) photo_url = path;
      }
      const { error } = await supabase.from("waterway_cleanup_reports").insert({
        user_id: user!.id,
        report_type: form.report_type,
        location: form.location,
        description: form.description || null,
        photo_url,
        barangay: form.barangay,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_waterway_reports"] });
      setOpen(false);
      setForm({ report_type: "", location: "", description: "", barangay: "" });
      setPhotoFile(null);
      toast.success("Waterway cleanup report submitted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Waterway Cleanup Report</h1>
          <p className="text-sm text-muted-foreground">Report polluted waterways, clogged drainage, or garbage in rivers</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Submit Report
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input placeholder="Search by location, barangay, type, or status..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Input type="month" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-[160px]" />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <Waves className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reports yet.</p>
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
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.report_type}</TableCell>
                    <TableCell className="text-sm">{r.location}</TableCell>
                    <TableCell className="text-sm">{r.barangay}</TableCell>
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
          <DialogHeader><DialogTitle className="font-heading">Waterway Cleanup Report</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Report Type *</Label>
              <select className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
                <option value="">Select type</option>
                {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Location *</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Waterway or area" /></div>
            <div><Label className="text-xs">Barangay *</Label><Input value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} placeholder="Barangay" /></div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the situation..." /></div>
            <div>
              <Label className="text-xs">Photo (optional)</Label>
              <input type="file" ref={photoRef} accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
              <Button type="button" variant="outline" size="sm" className="mt-1 w-full" onClick={() => photoRef.current?.click()}>{photoFile ? photoFile.name : "Upload photo"}</Button>
            </div>
            <Button className="w-full" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !form.report_type || !form.location || !form.barangay}>
              {submitMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WaterwayCleanupReport;
