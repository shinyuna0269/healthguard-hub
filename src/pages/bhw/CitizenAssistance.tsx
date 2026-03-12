import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ScanLine, Search, UserPlus } from "lucide-react";

const CitizenAssistance = () => {
  const [qrValue, setQrValue] = useState("");
  const [manualId, setManualId] = useState("");

  const citizenId = qrValue || manualId;
  const userPrefix = citizenId.replace("GSMS-2026-", "").toLowerCase();

  const { data: profile } = useQuery({
    queryKey: ["bhw_citizen_profile", userPrefix],
    queryFn: async () => {
      if (!userPrefix || userPrefix.length === 0) return null;
      // Demo lookup: try to find a profile whose user_id starts with the scanned prefix
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .ilike("user_id", `${userPrefix}%`)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!userPrefix,
  });

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
              <QrCodeScan className="h-4 w-4 text-primary" /> Scan / Enter QR Citizen ID
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label className="text-xs">QR Citizen ID</Label>
            <Input
              placeholder="GSMS-2026-XXXXXXXX"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Camera-based QR scanning can be integrated with device camera in production. For this demo, paste or
              type the QR Citizen ID.
            </p>
            {citizenId && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <QRCodeSVG value={citizenId} size={96} level="H" />
                <p className="text-[11px] font-mono text-muted-foreground">{citizenId}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" /> Citizen Profile Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!profile ? (
              <p className="text-sm text-muted-foreground">
                Enter a QR Citizen ID to retrieve a basic citizen profile for assistance.
              </p>
            ) : (
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
                </div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <Button variant="outline" size="sm" className="justify-start text-xs">
                    Submit Request for Citizen
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start text-xs">
                    Record Disease Case
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  BHWs can assist and submit records but cannot edit clinical health records.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Assisted Citizen Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            For residents without an online account, BHWs can collect basic details and forward them to the health
            center for full registration.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <Label className="text-xs">Full Name</Label>
              <Input placeholder="Full name" />
            </div>
            <div>
              <Label className="text-xs">Birthdate</Label>
              <Input type="date" />
            </div>
            <div>
              <Label className="text-xs">Barangay</Label>
              <Input placeholder="Barangay" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Address</Label>
              <Input placeholder="House / Street / Purok" />
            </div>
            <div>
              <Label className="text-xs">Contact Number</Label>
              <Input placeholder="09XXXXXXXXX" />
            </div>
            <div>
              <Label className="text-xs">Email (optional)</Label>
              <Input placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea rows={2} placeholder="Additional notes for health center staff..." />
          </div>
          <Button size="sm" className="mt-1">
            Submit Assisted Registration
          </Button>
          <p className="text-[11px] text-muted-foreground pt-1">
            In a full deployment this form would create a citizen record and QR ID; in this demo it documents assisted
            registrations for follow-up by Health Center Staff.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenAssistance;

