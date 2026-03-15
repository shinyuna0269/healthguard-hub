import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { QC_BARANGAYS, SANITATION_COMPLAINT_TYPES } from "@/lib/constants";

const BhwComplaints = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [complaintType, setComplaintType] = useState<string>(SANITATION_COMPLAINT_TYPES[0]);
  const [barangay, setBarangay] = useState<string>(QC_BARANGAYS[0]);
  const [description, setDescription] = useState("");

  const { data: complaints = [] } = useQuery({
    queryKey: ["bhw_sanitation_complaints"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("sanitation_complaints")
        .select("*")
        .order("date_submitted", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("sanitation_complaints").insert({
        citizen_id: user!.id,
        complaint_type: complaintType,
        barangay,
        description: description || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bhw_sanitation_complaints"] });
      setDescription("");
      toast.success("Sanitation complaint submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Sanitation Complaints</h1>
        <p className="text-sm text-muted-foreground">View and report sanitation issues. Shared with Sanitary Inspector.</p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Report Sanitation Complaint (BHW)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Complaint Type</Label>
              <Select value={complaintType} onValueChange={setComplaintType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SANITATION_COMPLAINT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Barangay</Label>
              <Select value={barangay} onValueChange={setBarangay}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QC_BARANGAYS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the sanitation issue..." />
          </div>
          <Button size="sm" className="gap-1" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !description}>
            <Send className="h-4 w-4" /> Submit Complaint
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading">All Sanitation Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No complaints recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((c) => (
                  <TableRow key={c.complaint_id}>
                    <TableCell className="text-sm">{c.date_submitted}</TableCell>
                    <TableCell className="text-sm">{c.complaint_type}</TableCell>
                    <TableCell className="text-sm">{c.barangay}</TableCell>
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

export default BhwComplaints;
