import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ScanLine, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import QrScanner from "react-qr-scanner";

const CitizenAssistance = () => {
  const { user } = useAuth();
  const [scannedId, setScannedId] = useState("");
  const [manualId, setManualId] = useState("");
  const [scannerError, setScannerError] = useState<string | null>(null);

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
    queryKey: ["bhw_citizen_profile", userPrefix],
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

  const {
    data: vaccinations = [],
    isLoading: vaccinationsLoading,
    error: vaccinationsError,
  } = useQuery({
    queryKey: ["bhw_citizen_vaccinations", citizenUserId],
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

  const {
    data: nutrition = [],
    isLoading: nutritionLoading,
    error: nutritionError,
  } = useQuery<any[]>({
    queryKey: ["bhw_citizen_nutrition", citizenUserId],
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

  const isLoading =
    profileLoading || vaccinationsLoading || nutritionLoading;
  const hasError =
    !!profileError || !!vaccinationsError || !!nutritionError || !!scannerError;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Citizen Assistance</h1>
          <p className="text-sm text-muted-foreground">
            Scan QR Citizen ID, search citizens, or assist with registration. BHWs can view basic info only.
          </p>
        </div>
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
                <p className="text-[11px] text-destructive mt-1">
                  {scannerError}
                </p>
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
              <Search className="h-4 w-4 text-primary" /> Citizen Profile Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <p className="text-sm text-muted-foreground">
                Loading citizen profile and recent records...
              </p>
            )}
            {hasError && !isLoading && (
              <p className="text-sm text-destructive">
                Unable to load citizen profile or records. Please check the QR code and try again.
              </p>
            )}
            {!isLoading && !hasError && !profile && (
              <p className="text-sm text-muted-foreground">
                Enter a QR Citizen ID to retrieve a basic citizen profile for assistance.
              </p>
            )}
            {!isLoading && !hasError && profile && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Basic Information</p>
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
                  <div>
                    <p className="text-[11px] text-muted-foreground">Barangay</p>
                    <p className="text-xs truncate">—</p>
                  </div>
                </div>
                <div className="pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Health summary (recent records)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="rounded-md border border-border bg-muted/30 p-2">
                      <p className="text-[11px] text-muted-foreground mb-1">Recent Vaccinations</p>
                      {vaccinations.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No vaccination records found.</p>
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
                      <p className="text-[11px] text-muted-foreground mb-1">Recent Nutrition Monitoring</p>
                      {nutrition.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No nutrition records found.</p>
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
                  <p className="text-[11px] text-muted-foreground pt-1">
                    BHWs can assist and submit records but cannot edit clinical health records.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CitizenAssistance;

