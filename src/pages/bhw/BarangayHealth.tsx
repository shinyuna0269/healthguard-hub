import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ShieldAlert, Syringe, HeartPulse } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-red, 0 72% 51%))",
  "hsl(var(--chart-blue, 217 91% 60%))",
  "hsl(var(--chart-orange, 38 92% 50%))",
  "hsl(152, 60%, 40%)",
];

const BhwBarangayHealth = () => {
  const { data: cases = [] } = useQuery({
    queryKey: ["bhw_health_cases"],
    queryFn: async () => {
      const { data } = await supabase.from("surveillance_cases").select("*").limit(200);
      return data || [];
    },
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["bhw_health_vaccinations"],
    queryFn: async () => {
      const { data } = await supabase.from("vaccinations").select("*").limit(200);
      return data || [];
    },
  });

  const { data: nutrition = [] } = useQuery({
    queryKey: ["bhw_health_nutrition"],
    queryFn: async () => {
      const { data } = await supabase.from("nutrition_records").select("*").limit(200);
      return data || [];
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["bhw_health_requests"],
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("id, status").limit(200);
      return data || [];
    },
  });

  // Disease by type
  const diseaseByType = cases.reduce<Record<string, number>>((acc, c) => {
    const count = typeof c.case_count === "number" && c.case_count > 0 ? c.case_count : 1;
    acc[c.disease] = (acc[c.disease] || 0) + count;
    return acc;
  }, {});
  const diseaseChartData = Object.entries(diseaseByType).map(([name, value]) => ({ name, value }));

  // Vaccination by status
  const vacByStatus = vaccinations.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});
  const vacChartData = Object.entries(vacByStatus).map(([name, value]) => ({ name, value }));

  const activeCases = cases.filter((c) => c.status === "active").length;
  const activeRequests = requests.filter((r) => r.status !== "Completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Barangay Health Data</h1>
        <p className="text-sm text-muted-foreground">Overview of health trends and program participation (read-only)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Active Disease Cases</p>
                <p className="text-lg font-bold">{activeCases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Vaccination Records</p>
                <p className="text-lg font-bold">{vaccinations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Nutrition Records</p>
                <p className="text-lg font-bold">{nutrition.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Active Requests</p>
                <p className="text-lg font-bold">{activeRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading">Disease Cases by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {diseaseChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={diseaseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading">Vaccination Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {vacChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={vacChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {vacChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BhwBarangayHealth;
