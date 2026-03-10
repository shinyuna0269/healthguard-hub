import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, ClipboardCheck, Upload } from "lucide-react";
import { toast } from "sonner";

const checklistItems = [
  "Waste Segregation", "Pest Control Measures", "Clean Water Supply", "Proper Drainage System",
  "Food Handling Compliance", "Ventilation Standards", "Restroom Facilities", "Fire Safety Equipment",
];

const SanitationPermit = () => {
  const { currentRole } = useAuth();
  const [search, setSearch] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ business_name: "", owner_name: "", business_type: "", address: "", notes: "" });
  const isBSI = currentRole === "BSI_User";
  const queryClient = useQueryClient();

  const { data: permits = [] } = useQuery({
    queryKey: ["sanitation_permits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sanitation_permits").select("*").order("application_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sanitation_permits").insert({
        business_name: form.business_name,
        owner_name: form.owner_name,
        business_type: form.business_type,
        address: form.address,
        notes: form.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sanitation_permits"] });
      setOpen(false);
      setForm({ business_name: "", owner_name: "", business_type: "", address: "", notes: "" });
      toast.success("Application submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = permits.filter(
    (p) => p.business_name.toLowerCase().includes(search.toLowerCase()) || p.owner_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Sanitation Permit & Inspection</h1>
          <p className="text-sm text-muted-foreground">Permit applications, inspections, and compliance tracking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              {isBSI ? <><ClipboardCheck className="h-4 w-4" /> New Inspection</> : <><Plus className="h-4 w-4" /> Submit Application</>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">{isBSI ? "Inspection Checklist" : "New Permit Application"}</DialogTitle>
            </DialogHeader>
            {isBSI ? (
              <div className="space-y-3">
                <div><Label className="text-xs">Establishment</Label><Input placeholder="Business name" /></div>
                <div className="space-y-2">
                  {checklistItems.map((item) => (
                    <div key={item} className="flex items-center justify-between p-2 rounded-md border border-border">
                      <span className="text-sm">{item}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{checklist[item] ? "Compliant" : "Non-Compliant"}</span>
                        <Switch checked={checklist[item] || false} onCheckedChange={(v) => setChecklist({ ...checklist, [item]: v })} />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-xs">Photo Evidence</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Upload inspection photos</p>
                  </div>
                </div>
                <Button className="w-full">Submit Inspection Report</Button>
              </div>
            ) : (
              <div className="grid gap-3">
                <div><Label className="text-xs">Business Name</Label><Input placeholder="Business name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
                <div><Label className="text-xs">Owner Name</Label><Input placeholder="Full name" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></div>
                <div><Label className="text-xs">Business Type</Label><Input placeholder="e.g., Food Establishment" value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} /></div>
                <div><Label className="text-xs">Address</Label><Input placeholder="Business address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label className="text-xs">Additional Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.business_name || !form.owner_name}>
                  {addMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search permits..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Business</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Owner</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Type</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Inspector</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{p.business_name}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{p.owner_name}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{p.business_type}</TableCell>
                  <TableCell className="text-sm">{p.application_date}</TableCell>
                  <TableCell className="text-sm hidden lg:table-cell">{p.inspector}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SanitationPermit;
