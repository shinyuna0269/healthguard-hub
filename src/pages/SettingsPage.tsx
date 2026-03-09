import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const SettingsPage = () => (
  <div className="space-y-6 max-w-2xl">
    <div>
      <h1 className="text-2xl font-bold font-heading">Settings</h1>
      <p className="text-sm text-muted-foreground">System preferences and configuration</p>
    </div>
    <Card className="glass-card">
      <CardHeader><CardTitle className="text-sm font-heading">Notifications</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Email Notifications</Label>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">SMS Reminders</Label>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Disease Alert Notifications</Label>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
    <Card className="glass-card">
      <CardHeader><CardTitle className="text-sm font-heading">System</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Auto-generate QR codes</Label>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Data Export Enabled</Label>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default SettingsPage;
