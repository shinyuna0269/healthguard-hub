import { useState } from "react";
import { useAuth, ROLE_LABELS, type UserRole } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, LogIn, Users } from "lucide-react";
import { toast } from "sonner";

const QUICK_LOGINS: { role: UserRole; email: string; label: string }[] = [
  { role: "Resident_User", email: "resident@demo.com", label: "Resident" },
  { role: "BusinessOwner_User", email: "business@demo.com", label: "Business Owner" },
  { role: "BHW_User", email: "bhw@demo.com", label: "BHW" },
  { role: "BSI_User", email: "bsi@demo.com", label: "Sanitary Inspector" },
  { role: "Clerk_User", email: "clerk@demo.com", label: "Clerk" },
  { role: "Captain_User", email: "captain@demo.com", label: "Captain" },
  { role: "SysAdmin_User", email: "admin@demo.com", label: "System Admin" },
];

const LoginPage = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  const handleQuickLogin = async (email: string, role: string) => {
    setQuickLoading(role);
    const { error } = await signIn(email, "demo123456");
    if (error) {
      toast.error(error.message);
    }
    setQuickLoading(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-xl health-gradient flex items-center justify-center mx-auto shadow-lg">
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold font-heading text-foreground tracking-tight">
            HEALTH & SANITATION MANAGEMENT
          </h1>
          <p className="text-sm text-muted-foreground">Government Service Management System</p>
        </div>

        {/* Login Form */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <LogIn className="h-4 w-4 text-primary" /> Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Login */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" /> Quick Login (Demo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LOGINS.map((q) => (
                <Button
                  key={q.role}
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 justify-start"
                  disabled={quickLoading !== null}
                  onClick={() => handleQuickLogin(q.email, q.role)}
                >
                  {quickLoading === q.role ? "..." : q.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
