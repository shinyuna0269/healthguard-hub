import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

const CitizenQR = () => {
  const { user, userName } = useAuth();
  const citizenId = `GSMS-2026-${user?.id?.slice(0, 8).toUpperCase() || "UNKNOWN"}`;

  const handlePrint = () => {
    const svg = document.getElementById("citizen-qr-svg") as unknown as SVGSVGElement | null;
    const qrMarkup = svg ? svg.outerHTML : "";

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=480,height=640");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>My QR Citizen ID</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #f3f4f6;
              color: #111827;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .wrapper {
              text-align: center;
              padding: 24px 20px;
            }
            .title {
              font-size: 14px;
              font-weight: 600;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              margin-bottom: 12px;
            }
            .id-label {
              font-size: 11px;
              color: #6b7280;
              margin-top: 12px;
            }
            .id-value {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              font-size: 13px;
              font-weight: 600;
              margin-top: 4px;
            }
            .qr-frame {
              display: inline-flex;
              padding: 16px;
              border-radius: 16px;
              border: 1px solid #e5e7eb;
              background: #ffffff;
              box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
            }
            svg {
              width: 200px;
              height: 200px;
            }
            @media print {
              body {
                background: #ffffff;
                min-height: auto;
              }
              .wrapper {
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="title">MY QR CITIZEN ID</div>
            <div class="qr-frame">
              ${qrMarkup}
            </div>
            <div class="id-label">Citizen ID</div>
            <div class="id-value">${citizenId}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

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
            <div className="p-4 bg-card rounded-xl border border-border">
              <QRCodeSVG id="citizen-qr-svg" value={citizenId} size={180} level="H" />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Citizen ID</p>
              <p className="text-sm font-mono font-semibold">{citizenId}</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" size="sm" className="flex-1 gap-1">
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
