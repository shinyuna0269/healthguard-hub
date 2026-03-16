import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Eye, EyeOff, LogIn, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "react-router-dom";

type LoginAs = "citizen" | "staff";

const LoginPage = () => {
  const { signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("healthguard-theme");
    if (stored === "light" || stored === "dark") return stored;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  const loginAs = useMemo<LoginAs>(() => {
    const params = new URLSearchParams(location.search);
    return params.get("portal") === "staff" ? "staff" : "citizen";
  }, [location.search]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem("healthguard-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password, loginAs);
    if (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-[radial-gradient(circle_at_top,_#e5e7eb,_#f9fafb)] dark:bg-[radial-gradient(circle_at_top,_#020617,_#0f172a)] transition-colors">
      <div className="absolute top-4 right-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full border-border/70 bg-background/60 backdrop-blur-md"
          onClick={toggleTheme}
          aria-label="Toggle night mode"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-sky-500 flex items-center justify-center mx-auto shadow-xl">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold font-heading text-foreground tracking-tight">
              HealthGuard Hub
            </h1>
            <p className="text-sm text-muted-foreground">
              Unified health, sanitation, and surveillance portal for Quezon City.
            </p>
          </div>
        </div>

        <Card className="glass-card border-border/70 bg-background/80 dark:bg-slate-900/80 backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-heading flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-primary" /> Sign in to your account
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded p-1"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full mt-1" disabled={loading}>
                {loading ? "Signing you in..." : "Sign In"}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Authorized access for Quezon City residents and government personnel.
              </p>
            </form>
            <p className="mt-3 text-[11px] text-center text-muted-foreground">
              <span>Staff or inspector? </span>
              <Link
                to="/login?portal=staff"
                className="underline underline-offset-2 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                aria-label="Access staff portal"
              >
                Access staff portal
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-[11px] text-center text-muted-foreground max-w-sm mx-auto">
          By signing in, you acknowledge that access to citizen and health records is restricted to
          authorized government personnel and registered citizens of Quezon City.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
