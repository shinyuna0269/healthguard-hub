import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { QrCode, Stethoscope, HeartPulse, Syringe } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { useNavigate } from "react-router-dom";

const StaffScanQr = () => {
  const [citizenId, setCitizenId] = useState("");
  const navigate = useNavigate();

  const userPrefix = useMemo(() => {
    const v = citizenId.trim();
    if (!v) return "";
    return v.replace("GSMS-2026-", "").toLowerCase();
  }, [citizenId]);

  const { data: profile } = useQuery({
    queryKey: ["staff_scan_profile", userPrefix],
    queryFn: async () => {
      if (!userPrefix) return null;
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .ilike("user_id", `${userPrefix}%`)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!userPrefix,
  });

  const citizenUserId = profile?.user_id;

  const { data: health = [] } = useQuery({
    queryKey: ["staff_citizen_health", citizenUserId],
    queryFn: async () => {
      if (!citizenUserId) return [];
      const { data } = await supabase
        .from("resident_health_records")
        .select("*")
        .eq("user_id", citizenUserId)
        .order("record_date", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!citizenUserId,
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["staff_citizen_vaccinations", citizenUserId],
    queryFn: async () => {
      // Current schema stores vaccination records without citizen linkage; show recent records for workflow demo.
      const { data } = await supabase
        .from("vaccinations")
        .select("*")
        .order("vaccination_date", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!citizenUserId,
  });

  const { data: consultations = [] } = useQuery({
    queryKey: ["staff_consultations_recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("consultations")
        .select("*")
        .order("consultation_date", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!citizenUserId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Scan QR Citizen ID</h1>
        <p className="text-sm text-muted-foreground">Fast retrieval of citizen records for clinic workflow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" /> QR / Manual Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Citizen ID</Label>
              <Input
                placeholder="GSMS-2026-XXXXXXXX"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Camera scanning can be wired for tablets/mobile. For now, paste the scanned QR Citizen ID.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading">Citizen Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!profile ? (
              <p className="text-sm text-muted-foreground">Enter a Citizen ID to load profile and history.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Citizen Name</p>
                    <p className="text-sm font-medium truncate">{profile.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Citizen ID</p>
                    <p className="text-xs font-mono truncate">{citizenId}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Email</p>
                    <p className="text-xs truncate">{profile.email || "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Button size="sm" className="gap-1" onClick={() => navigate("/health-center")}>
                    <Stethoscope className="h-4 w-4" /> Start Consultation
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/staff/assessments")}>
                    <HeartPulse className="h-4 w-4" /> Perform Health Assessment
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/immunization")}>
                    <Syringe className="h-4 w-4" /> Record Vaccination
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading">Previous Consultations (Recent)</CardTitle>
            </CardHeader>
            <CardContent>
              {consultations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No consultations found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Patient</TableHead>
                      <TableHead className="text-xs">Diagnosis</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{c.consultation_date}</TableCell>
                        <TableCell className="text-sm">{c.patient_name}</TableCell>
                        <TableCell className="text-sm">{c.diagnosis || "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading">Vaccination History (Recent)</CardTitle>
            </CardHeader>
            <CardContent>
              {vaccinations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No vaccination records found.</p>
              ) : (
                <div className="space-y-2">
                  {vaccinations.slice(0, 6).map((v) => (
                    <div key={v.id} className="p-3 rounded-lg border border-border bg-muted/20">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{v.vaccine}</p>
                        <StatusBadge status={v.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {v.child_name} · {v.vaccination_date}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading">Health Records (Citizen)</CardTitle>
            </CardHeader>
            <CardContent>
              {health.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No resident health records found.</p>
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
                    {health.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.record_date}</TableCell>
                        <TableCell className="text-sm">{r.record_type}</TableCell>
                        <TableCell className="text-sm">{r.diagnosis || "—"}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{r.provider || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StaffScanQr;

