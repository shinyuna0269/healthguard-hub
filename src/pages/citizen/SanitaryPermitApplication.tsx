import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import RecordDetailModal from "@/components/RecordDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { FileCheck, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const SanitaryPermitApplication = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form, setForm] = useState({ business_name: "", business_type: "", address: "" });
  const queryClient = useQueryClient();

  const { data: permits = [] } = useQuery({
    queryKey: ["citizen_sanitary_permits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("resident_permits").select("*").order("application_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("resident_permits").insert({
        user_id: user!.id,
        business_name: form.business_name,
        business_type: form.business_type || null,
        status: "Submitted",
      }).select("id").single();
      if (error) throw error;
      await supabase.from("service_requests").insert({
        user_id: user!.id,
        request_type: "Sanitary Permit Application",
        title: `Sanitary permit — ${form.business_name}`,
        description: `Business type: ${form.business_type || "N/A"}; Address: ${form.address || "N/A"}`,
        status: "Submitted",
        reference_id: data.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_sanitary_permits", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["citizen_requests_summary", user?.id] });
      setOpen(false);
      setForm({ business_name: "", business_type: "", address: "" });
      toast.success("Sanitary permit application submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Sanitary Permit Applications</h1>
          <p className="text-sm text-muted-foreground">Apply for and track sanitary permits</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Apply for Sanitary Permit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading text-sm">New Sanitary Permit Application</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label className="text-xs">Business Name</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
              <div><Label className="text-xs">Business Type</Label><Input value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} placeholder="e.g., Food, Retail" /></div>
              <div><Label className="text-xs">Business Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, Barangay, City" /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.business_name}>
                {addMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedRecord && (
        <RecordDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Permit Application Details"
          fields={[
            { label: "Business Name", value: selectedRecord.business_name },
            { label: "Business Type", value: selectedRecord.business_type },
            { label: "Application Date", value: selectedRecord.application_date },
            { label: "Status", value: selectedRecord.status, isStatus: true },
            { label: "Submitted", value: new Date(selectedRecord.created_at).toLocaleDateString() },
          ]}
        />
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">My Applications</CardTitle></CardHeader>
        <CardContent>
          {permits.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No permit applications found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Business</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Applied</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permits.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRecord(p); setDetailOpen(true); }}>
                    <TableCell className="font-medium text-sm">{p.business_name}</TableCell>
                    <TableCell className="text-sm">{p.business_type}</TableCell>
                    <TableCell className="text-sm">{p.application_date}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
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

export default SanitaryPermitApplication;
