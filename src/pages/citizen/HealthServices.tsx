import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { HeartPulse, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RecordDetailModal, { type DetailField } from "@/components/RecordDetailModal";
import { toast } from "sonner";

type RecordType = "record" | "assessment" | "referral";

interface HealthRecordRow {
  id: string;
  record_date: string;
  record_type: string;
  diagnosis: string | null;
  medicine: string | null;
  provider: string | null;
  user_id: string;
  created_at: string;
  health_center?: string | null;
  document_url?: string | null;
  referral_destination?: string | null;
}

const HealthServices = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [concern, setConcern] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecordRow | null>(null);
  const [selectedTab, setSelectedTab] = useState<RecordType>("record");
  const queryClient = useQueryClient();

  const { data: records = [] } = useQuery({
    queryKey: ["citizen_health_records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resident_health_records")
        .select("*")
        .eq("user_id", user!.id)
        .order("record_date", { ascending: false });
      if (error) throw error;
      return (data || []) as HealthRecordRow[];
    },
    enabled: !!user,
  });

  const healthRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          r.record_type !== "Health Assessment" &&
          (r.record_type || "").toLowerCase() !== "referral"
      ),
    [records]
  );
  const assessments = useMemo(
    () => records.filter((r) => (r.record_type || "") === "Health Assessment"),
    [records]
  );
  const referrals = useMemo(
    () =>
      records.filter(
        (r) => (r.record_type || "").toLowerCase() === "referral"
      ),
    [records]
  );

  const requestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_requests").insert({
        user_id: user!.id,
        request_type: "Health Consultation",
        title: "Health consultation request",
        description: concern || "Citizen requested a health consultation.",
        status: "Submitted",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen_service_requests", user?.id] });
      setOpen(false);
      setConcern("");
      toast.success("Consultation request submitted to your health center");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openDetail = (row: HealthRecordRow, tab: RecordType) => {
    setSelectedRecord(row);
    setSelectedTab(tab);
    setDetailOpen(true);
  };

  const detailFields = (r: HealthRecordRow): DetailField[] => [
    { label: "Date", value: r.record_date },
    { label: "Health Center", value: (r as HealthRecordRow).health_center ?? "—" },
    { label: "Physician / Staff", value: r.provider ?? "—" },
    { label: "Diagnosis / Notes", value: r.diagnosis ?? "—" },
    { label: "Medicine", value: r.medicine ?? "—" },
    { label: "Record type", value: r.record_type },
    { label: "Submitted", value: new Date(r.created_at).toLocaleString() },
  ];

  const attachments = selectedRecord?.document_url
    ? [{ label: "Attached document", url: selectedRecord.document_url }]
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Health Services</h1>
          <p className="text-sm text-muted-foreground">View your health records and request consultations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Request Consultation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading text-sm">Request Health Consultation</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label className="text-xs">Describe your health concern</Label>
                <Textarea rows={3} placeholder="Briefly describe your symptoms or concern..." value={concern} onChange={(e) => setConcern(e.target.value)} />
              </div>
              <Button className="w-full" onClick={() => requestMutation.mutate()} disabled={requestMutation.isPending}>
                {requestMutation.isPending ? "Submitting..." : "Submit Consultation Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as RecordType)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="record" className="gap-1">
            <HeartPulse className="h-4 w-4" />
            Health Records
          </TabsTrigger>
          <TabsTrigger value="assessment">
            Health Assessments
          </TabsTrigger>
          <TabsTrigger value="referral">
            Referral Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-2">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-heading">Health Records</CardTitle></CardHeader>
            <CardContent>
              {healthRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No health records found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Diagnosis</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Provider</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {healthRecords.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDetail(r, "record")}
                      >
                        <TableCell className="text-sm">{r.record_date}</TableCell>
                        <TableCell className="text-sm">{r.record_type}</TableCell>
                        <TableCell className="text-sm line-clamp-1">{r.diagnosis ?? "—"}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{r.provider ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-2">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-heading">Health Assessments</CardTitle></CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No health assessments found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Notes / Summary</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Staff</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDetail(r, "assessment")}
                      >
                        <TableCell className="text-sm">{r.record_date}</TableCell>
                        <TableCell className="text-sm line-clamp-1">{r.diagnosis ?? "—"}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{r.provider ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referral" className="space-y-2">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-heading">Referral Records</CardTitle></CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No referral records found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Notes</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Referred by</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDetail(r, "referral")}
                      >
                        <TableCell className="text-sm">{r.record_date}</TableCell>
                        <TableCell className="text-sm line-clamp-1">{r.diagnosis ?? "—"}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{r.provider ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedRecord && (
        <RecordDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title={
            selectedTab === "referral"
              ? "Referral Record Details"
              : selectedTab === "assessment"
                ? "Health Assessment Details"
                : "Health Record Details"
          }
          fields={detailFields(selectedRecord)}
          attachments={attachments}
          referralDestination={
            selectedTab === "referral"
              ? (selectedRecord as HealthRecordRow).referral_destination ?? selectedRecord.medicine ?? "—"
              : undefined
          }
        />
      )}
    </div>
  );
};

export default HealthServices;
