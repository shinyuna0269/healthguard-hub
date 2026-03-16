import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ScanLine, Search, Stethoscope, HeartPulse, Syringe } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { useNavigate } from "react-router-dom";
import QrScanner from "react-qr-scanner";

const StaffScanQr = () => {
  const [scannedId, setScannedId] = useState("");
  const [manualId, setManualId] = useState("");
  const [scannerError, setScannerError] = useState<string | null>(null);
  const navigate = useNavigate();

  const citizenId = scannedId || manualId;

  const userPrefix = useMemo(() => {
    if (!citizenId) return "";
    return citizenId.replace("GSMS-2026-", "").toLowerCase();
  }, [citizenId]);

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery<any | null>({
    queryKey: ["staff_citizen_profile", userPrefix],
    queryFn: async () => {
      if (!userPrefix) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .ilike("user_id", `${userPrefix}%`)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userPrefix,
  });

  const citizenUserId = (profile as any)?.user_id as string | undefined;

  const { data: vaccinations = [], isLoading: vaccinationsLoading } = useQuery({
    queryKey: ["staff_citizen_vaccinations", citizenUserId],
    queryFn: async () => {
      if (!citizenUserId) return [];
      const { data, error } = await supabase
        .from("vaccinations")
        .select("*")
        .order("vaccination_date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!citizenUserId,
  });

  const { data: nutrition = [], isLoading: nutritionLoading } = useQuery<any[]>({
    queryKey: ["staff_citizen_nutrition", citizenUserId],
    queryFn: async () => {
      if (!citizenUserId) return [];
      const { data, error } = await supabase
        .from("nutrition_records")
        .select("*")
        .order("monitoring_date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!citizenUserId,
  });

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

  const { data: consultations = [] } = useQuery({
    queryKey: ["staff_consultations_recent", citizenUserId],
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

  const isLoading = profileLoading || vaccinationsLoading || nutritionLoading;
  const hasError = !!profileError || !!scannerError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Scan QR Citizen ID</h1>
        <p className="text-sm text-muted-foreground">
          Scan or search by Citizen ID to view profile and health records
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-primary" /> Scan / Enter QR Citizen ID
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Scan QR using camera</Label>
              <div className="rounded-md border bg-muted/40 overflow-hidden">
                <QrScanner
                  onScan={(result) => {
                    const value = Array.isArray(result)
                      ? result[0]?.text
                      : (result as any)?.text;
                    if (value && value !== scannedId) {
                      setScannedId(value);
                      setScannerError(null);
                    }
                  }}
                  onError={(error) => {
                    setScannerError(
                      error instanceof Error
                        ? error.message
                        : "Unable to access camera for QR scanning.",
                    );
                  }}
                  constraints={{ video: { facingMode: "environment" } }}
                  style={{ width: "100%" }}
                />
              </div>
              {scannerError && (
                <p className="text-[11px] text-destructive mt-1">{scannerError}</p>
              )}
            </div>
            <div className="space-y-2 pt-2">
              <Label className="text-xs">Or manually enter QR Citizen ID</Label>
              <Input
                placeholder="GSMS-2026-XXXXXXXX"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                You can scan using the camera or type the QR Citizen ID if scanning is not available.
              </p>
              {citizenId && (
                <p className="text-[11px] font-mono text-muted-foreground break-all">
                  Current ID: {citizenId}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" /> Citizen Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading citizen profile...</p>
            )}
            {hasError && !isLoading && (
              <p className="text-sm text-destructive">
                Unable to load citizen profile. Please check the QR code and try again.
              </p>
            )}
            {!isLoading && !hasError && !profile && (
              <p className="text-sm text-muted-foreground">
                Enter or scan a QR Citizen ID to retrieve citizen profile.
              </p>
            )}
            {!isLoading && !hasError && profile && (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Citizen Name</p>
                    <p className="font-medium truncate">{profile.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Citizen ID</p>
                    <p className="font-mono text-xs truncate">{citizenId}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Email</p>
                    <p className="text-xs truncate">{profile.email || "—"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() =>
                      navigate("/staff/consultations", {
                        state: { patient_name: profile.full_name, citizenId },
                      })
                    }
                  >
                    <Stethoscope className="h-4 w-4" /> Consultation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() =>
                      navigate("/staff/assessments", { state: { citizenId, patient_name: profile.full_name } })
                    }
                  >
                    <HeartPulse className="h-4 w-4" /> Health Assessment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => navigate("/staff/vaccination")}
                  >
                    <Syringe className="h-4 w-4" /> Vaccination
                  </Button>
                </div>
                <div className="pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Recent records</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="rounded-md border border-border bg-muted/30 p-2">
                      <p className="text-[11px] text-muted-foreground mb-1">Recent Vaccinations</p>
                      {vaccinations.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None</p>
                      ) : (
                        <ul className="space-y-1">
                          {vaccinations.map((v) => (
                            <li key={v.id} className="text-xs flex justify-between gap-2">
                              <span className="truncate">{v.vaccine}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {v.vaccination_date}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 p-2">
                      <p className="text-[11px] text-muted-foreground mb-1">Nutrition</p>
                      {nutrition.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None</p>
                      ) : (
                        <ul className="space-y-1">
                          {nutrition.map((n: any) => (
                            <li key={n.id} className="text-xs flex justify-between gap-2">
                              <span className="truncate">{n.child_name || "Child"}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {n.nutritional_status || n.status || "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading">Previous Consultations</CardTitle>
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
              <CardTitle className="text-sm font-heading">Health Records</CardTitle>
            </CardHeader>
            <CardContent>
              {health.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No health records found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Summary</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Provider</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {health.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.record_date}</TableCell>
                        <TableCell className="text-sm">{r.record_type}</TableCell>
                        <TableCell className="text-sm truncate max-w-[120px]">{r.diagnosis || "—"}</TableCell>
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
