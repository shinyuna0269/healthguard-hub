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
import { ShieldAlert, Send, CheckCircle, XCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { QC_BARANGAYS, QC_BARANGAY_COORDS } from "@/lib/constants";

const DISEASES = ["Dengue", "COVID-19", "Tuberculosis", "Influenza", "Measles", "Cholera", "Other"];

const REPORT_STATUSES = [
  "Submitted",
  "Under BHW Review",
  "Under Medical Verification",
  "Verified Case",
  "Closed",
] as const;

const BhwCommunityReports = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [disease, setDisease] = useState<string>(DISEASES[0]);
  const [barangay, setBarangay] = useState<string>(QC_BARANGAYS[0]);
  const [details, setDetails] = useState("");
  const [citizenId, setCitizenId] = useState("");

  const { data: reports = [] } = useQuery({
    queryKey: ["bhw_disease_reports"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("disease_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("disease_reports").insert({
        disease,
        patient_location: barangay,
        details: `Citizen ID: ${citizenId || "N/A"} — ${details}`,
        reported_by: user!.id,
        reporter: "BHW Field Report",
        status: "Under BHW Review",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bhw_disease_reports"] });
      setDetails("");
      setCitizenId("");
      toast.success("Disease report submitted for verification");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("disease_reports").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bhw_disease_reports"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyCaseMutation = useMutation({
    mutationFn: async (report: { id: string; disease: string; patient_location: string }) => {
      const { error: insertError } = await supabase.from("surveillance_cases").insert({
        disease: report.disease,
        patient_location: report.patient_location,
        case_date: new Date().toISOString().slice(0, 10),
        status: "active",
      });
      if (insertError) throw insertError;
      const { error: updateError } = await supabase.from("surveillance_cases").update({ status: "Verified Case" }).eq("id", report.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bhw_disease_reports"] });
      queryClient.invalidateQueries({ queryKey: ["disease_map_cases"] });
      toast.success("Case verified and added to surveillance map");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = (id: string, status: string) => updateStatusMutation.mutate({ id, status });
  const verifyCase = (r: { id: string; disease: string; patient_location: string }) => verifyCaseMutation.mutate(r);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Community Reports</h1>
        <p className="text-sm text-muted-foreground">Review citizen disease reports and verify cases for the Health Surveillance System</p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" /> Report Disease Case (BHW)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Citizen ID (optional)</Label>
              <Input placeholder="GSMS-2026-XXXXXXXX" value={citizenId} onChange={(e) => setCitizenId(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Disease Type</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs" value={disease} onChange={(e) => setDisease(e.target.value)}>
                {DISEASES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Barangay</Label>
              <Select value={barangay} onValueChange={setBarangay}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select barangay" /></SelectTrigger>
                <SelectContent>
                  {QC_BARANGAYS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Symptoms / Details</Label>
            <Textarea rows={2} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe symptoms and observations..." />
          </div>
          <Button size="sm" className="gap-1" onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending || !details}>
            <Send className="h-4 w-4" /> Submit Disease Report
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading">Disease Reports — Verification Workflow</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Submitted → Under BHW Review → Under Medical Verification → Verified Case (appears on map) or Closed
          </p>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No disease reports yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Disease</TableHead>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.case_date ?? (r.created_at && new Date(r.created_at).toLocaleDateString())}</TableCell>
                    <TableCell className="text-sm">{r.disease}</TableCell>
                    <TableCell className="text-sm">{r.patient_location || "—"}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-xs space-x-1">
                      {r.status === "Submitted" && (
                        <Button size="sm" variant="outline" className="h-7 gap-0.5" onClick={() => setStatus(r.id, "Under BHW Review")}>
                          BHW Review
                        </Button>
                      )}
                      {r.status === "Under BHW Review" && (
                        <Button size="sm" variant="outline" className="h-7 gap-0.5" onClick={() => setStatus(r.id, "Under Medical Verification")}>
                          To Health Center
                        </Button>
                      )}
                      {(r.status === "Under Medical Verification" || r.status === "Under BHW Review") && (
                        <>
                          <Button size="sm" className="h-7 gap-0.5" onClick={() => verifyCase(r)} disabled={verifyCaseMutation.isPending}>
                            <CheckCircle className="h-3.5 w-3.5" /> Verify
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 gap-0.5 text-destructive" onClick={() => setStatus(r.id, "Closed")}>
                            <XCircle className="h-3.5 w-3.5" /> Close
                          </Button>
                        </>
                      )}
                    </TableCell>
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

export default BhwCommunityReports;
