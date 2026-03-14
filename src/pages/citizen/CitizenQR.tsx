import { useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

const CitizenQR = () => {
  const { user, userName } = useAuth();
  const citizenId = `CZN-${user?.id?.slice(0, 6).toUpperCase() || "000000"}`;
  const qrRef = useRef<HTMLDivElement>(null);

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

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, totalW, totalH);

      // Header
      ctx.fillStyle = "#111827";
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("QR CITIZEN ID", totalW / 2, padding + 20);

      if (userName) {
        ctx.font = "14px system-ui, sans-serif";
        ctx.fillStyle = "#6b7280";
        ctx.fillText(userName, totalW / 2, padding + 44);
      }

      // QR Code
      ctx.drawImage(img, padding, padding + headerHeight, qrSize, qrSize);

      // Footer
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
  }, [citizenId, userName]);

  const handlePrint = useCallback(() => {
    const svgEl = qrRef.current?.querySelector("svg");
    const qrMarkup = svgEl ? svgEl.outerHTML : "";

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=480,height=640");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Citizen ID - ${citizenId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #f3f4f6;
              color: #111827;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .card {
              background: #fff;
              border: 2px solid #e5e7eb;
              border-radius: 16px;
              padding: 32px 28px;
              text-align: center;
              max-width: 320px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            }
            .title { font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
            .name { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
            .qr-frame { display: inline-flex; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; }
            .qr-frame svg { width: 200px; height: 200px; }
            .id-label { font-size: 11px; color: #6b7280; margin-top: 16px; }
            .id-value { font-family: monospace; font-size: 14px; font-weight: 700; margin-top: 4px; }
            @media print {
              body { background: #fff; min-height: auto; }
              .card { box-shadow: none; border: 1px solid #d1d5db; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">QR Citizen ID</div>
            ${userName ? `<div class="name">${userName}</div>` : ""}
            <div class="qr-frame">${qrMarkup}</div>
            <div class="id-label">Citizen ID</div>
            <div class="id-value">${citizenId}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  }, [citizenId, userName]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">My QR Citizen ID</h1>
        <p className="text-sm text-muted-foreground">Your unique QR code for health and sanitation services</p>
      </div>
      <div className="max-w-sm mx-auto">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-sm font-heading">Digital Citizen ID</CardTitle>
            {userName && <p className="text-xs text-muted-foreground">{userName}</p>}
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div ref={qrRef} className="p-4 bg-card rounded-xl border border-border">
              <QRCodeSVG value={citizenId} size={180} level="H" />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Citizen ID</p>
              <p className="text-sm font-mono font-semibold">{citizenId}</p>
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
      </div>
    </div>
  );
};

export default CitizenQR;
