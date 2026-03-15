import { useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, User, Hash, Calendar, Droplet, Users, MapPin, Phone, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const formatDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return d;
  }
};

const CitizenQR = () => {
  const { user, userName, authRealm, citizenProfile } = useAuth();
  const citizenId = user?.id ? `CZN-${user.id.slice(0, 8).toUpperCase()}` : "—";
  const qrRef = useRef<HTMLDivElement>(null);

  // When logged in as staff (HSM), fallback to HSM profiles if needed (e.g. demo)
  const { data: hsmProfile } = useQuery({
    queryKey: ["hsm_profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, date_of_birth, blood_type, gender, address, contact_number")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id && authRealm === "hsm",
  });

  const isCitizenRealm = authRealm === "citizen";

  const fullName = isCitizenRealm && citizenProfile
    ? [citizenProfile.first_name, citizenProfile.last_name].filter(Boolean).join(" ") || userName || "—"
    : hsmProfile?.full_name || userName || "—";
  const email = (isCitizenRealm ? user?.email : hsmProfile?.email) || user?.email || "—";
  const dateOfBirth = isCitizenRealm && citizenProfile
    ? formatDate(citizenProfile.birthdate)
    : formatDate(hsmProfile?.date_of_birth);
  const bloodType = isCitizenRealm ? "—" : (hsmProfile?.blood_type ?? "—");
  const gender = isCitizenRealm ? "—" : (hsmProfile?.gender ?? "—");
  const address = isCitizenRealm && citizenProfile ? (citizenProfile.address ?? "—") : (hsmProfile?.address ?? "—");
  const contactNumber = isCitizenRealm && citizenProfile
    ? (citizenProfile.contact_number ?? "—")
    : (hsmProfile?.contact_number ?? "—");

  const handleDownload = useCallback(() => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const padding = 40;
      const headerHeight = 60;
      const footerHeight = 80;
      const qrSize = 400;
      const totalW = qrSize + padding * 2;
      const totalH = headerHeight + qrSize + footerHeight + padding * 2;
      canvas.width = totalW;
      canvas.height = totalH;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, totalW, totalH);
      ctx.fillStyle = "#111827";
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("QR CITIZEN ID", totalW / 2, padding + 20);
      if (fullName && fullName !== "—") {
        ctx.font = "14px system-ui, sans-serif";
        ctx.fillStyle = "#6b7280";
        ctx.fillText(fullName, totalW / 2, padding + 44);
      }
      ctx.drawImage(img, padding, padding + headerHeight, qrSize, qrSize);
      ctx.fillStyle = "#6b7280";
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillText("Citizen ID", totalW / 2, padding + headerHeight + qrSize + 24);
      ctx.fillStyle = "#111827";
      ctx.font = "bold 14px monospace";
      ctx.fillText(citizenId, totalW / 2, padding + headerHeight + qrSize + 48);

      const link = document.createElement("a");
      link.download = `QR-Citizen-ID-${citizenId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [citizenId, fullName]);

  const handlePrint = useCallback(() => {
    const svgEl = qrRef.current?.querySelector("svg");
    const qrMarkup = svgEl ? svgEl.outerHTML : "";
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=800,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Citizen ID - ${citizenId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, sans-serif; background: #1a1a1a; color: #e5e7eb; padding: 24px; }
            .layout { display: flex; gap: 32px; max-width: 720px; margin: 0 auto; }
            .qr-section { text-align: center; }
            .qr-section h1 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
            .qr-section .sub { font-size: 12px; color: #9ca3af; margin-bottom: 16px; }
            .qr-frame { display: inline-block; padding: 16px; background: #fff; border-radius: 12px; }
            .qr-frame svg { width: 180px; height: 180px; }
            .scan { font-weight: 600; margin-top: 12px; }
            .scan-detail { font-size: 12px; color: #9ca3af; margin-top: 4px; }
            .info-section { flex: 1; }
            .info-section h2 { font-size: 14px; margin-bottom: 16px; }
            .info-row { margin-bottom: 12px; }
            .info-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
            .info-value { font-size: 14px; margin-top: 2px; }
          </style>
        </head>
        <body>
          <div class="layout">
            <div class="qr-section">
              <h1>QR Citizen ID</h1>
              <p class="sub">Your digital citizen identification card.</p>
              <div class="qr-frame">${qrMarkup}</div>
              <p class="scan">Scan for Verification</p>
              <p class="scan-detail">Present this QR code for identity verification at government facilities.</p>
            </div>
            <div class="info-section">
              <h2>Citizen Information</h2>
              <div class="info-row"><div class="info-label">Full Name</div><div class="info-value">${fullName}</div></div>
              <div class="info-row"><div class="info-label">Citizen ID</div><div class="info-value">${citizenId}</div></div>
              <div class="info-row"><div class="info-label">Date of Birth</div><div class="info-value">${dateOfBirth}</div></div>
              <div class="info-row"><div class="info-label">Blood Type</div><div class="info-value">${bloodType}</div></div>
              <div class="info-row"><div class="info-label">Gender</div><div class="info-value">${gender}</div></div>
              <div class="info-row"><div class="info-label">Registered Address</div><div class="info-value">${address}</div></div>
              <div class="info-row"><div class="info-label">Contact Number</div><div class="info-value">${contactNumber}</div></div>
              <div class="info-row"><div class="info-label">Email Address</div><div class="info-value">${email}</div></div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 300);
  }, [citizenId, fullName, dateOfBirth, bloodType, gender, address, contactNumber, email]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">My QR Citizen ID</h1>
        <p className="text-sm text-muted-foreground">
          Your digital citizen identification card for health and sanitation services.
          {isCitizenRealm && (
            <span className="block mt-0.5 text-xs text-muted-foreground/80">
              Profile data is loaded from the Citizen Information system.
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <Card className="glass-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-sm font-heading">QR Citizen ID</CardTitle>
            <p className="text-xs text-muted-foreground">Your digital citizen identification card.</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div ref={qrRef} className="p-4 bg-white rounded-xl border border-border">
              <QRCodeSVG value={citizenId} size={200} level="H" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Scan for Verification</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Present this QR code for identity verification at government facilities.
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={handleDownload}>
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-heading">Citizen Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</p>
                <p className="text-sm font-medium mt-0.5">{fullName}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Citizen ID</p>
                <p className="text-sm font-mono font-medium mt-0.5">{citizenId}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Date of Birth</p>
                <p className="text-sm mt-0.5">{dateOfBirth}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Droplet className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Blood Type</p>
                <p className="text-sm mt-0.5">{bloodType}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Gender</p>
                <p className="text-sm mt-0.5">{gender}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Registered Address</p>
                <p className="text-sm mt-0.5 break-words">{address}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Contact Number</p>
                <p className="text-sm mt-0.5">{contactNumber}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Email Address</p>
                <p className="text-sm mt-0.5 break-all">{email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CitizenQR;
