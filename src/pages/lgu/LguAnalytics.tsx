import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, FileText, Syringe, ShieldAlert, ClipboardCheck, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(217, 91%, 60%)"];

const LguAnalytics = () => {
  const { data: citizens = [], isLoading: citizensLoading, error: citizensError } = useQuery({
    queryKey: ["lgu_analytics_citizens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id").limit(5000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: requests = [], isLoading: requestsLoading, error: requestsError } = useQuery({
    queryKey: ["lgu_analytics_requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_requests").select("id, request_type, status").limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: cases = [], isLoading: casesLoading, error: casesError } = useQuery({
    queryKey: ["lgu_analytics_cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveillance_cases")
        .select("id, disease, status, case_count, case_date")
        .order("case_date", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: vaccinations = [], isLoading: vaccinationsLoading, error: vaccinationsError } = useQuery({
    queryKey: ["lgu_analytics_vac"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vaccinations").select("id, status, vaccination_date").limit(2000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: establishments = [], isLoading: establishmentsLoading, error: establishmentsError } = useQuery({
    queryKey: ["lgu_analytics_establishments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("establishments").select("id, status").limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading =
    citizensLoading || requestsLoading || casesLoading || vaccinationsLoading || establishmentsLoading;
  const hasError =
    citizensError || requestsError || casesError || vaccinationsError || establishmentsError;

  const totalCitizens = citizens.length;
  const totalRequests = requests.length;
  const totalVaccinations = vaccinations.length;
  const completedVaccinations = vaccinations.filter((v) => (v.status || "").toLowerCase() === "completed").length;
  const activeDiseaseCases = cases
    .filter((c) => (c.status || "").toLowerCase() === "active")
    .reduce((s, c) => s + (c.case_count || 1), 0);
  const totalDiseaseCases = cases.reduce((s, c) => s + (c.case_count || 1), 0);
  const compliantEstablishments = establishments.filter(
    (e) => (e.status || "").toLowerCase() === "registered",
  ).length;
  const complianceRate =
    establishments.length > 0
      ? Math.round((compliantEstablishments / establishments.length) * 100)
      : 0;

  const reqByType = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.request_type] = (acc[r.request_type] || 0) + 1;
    return acc;
  }, {});
  const reqChartData = Object.entries(reqByType).map(([name, value]) => ({ name, value }));

  const permitByStatus = establishments.reduce<Record<string, number>>((acc, e) => {
    const s = e.status || "unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const permitChartData = Object.entries(permitByStatus).map(([name, value]) => ({ name, value }));

  const diseaseByType = cases.reduce<Record<string, number>>((acc, c) => {
    const d = c.disease || "Unknown";
    acc[d] = (acc[d] || 0) + (c.case_count || 1);
    return acc;
  }, {});
  const diseaseChartData = Object.entries(diseaseByType).map(([name, value]) => ({ name, cases: value }));

  const casesByDate = cases.reduce<Record<string, number>>((acc, c) => {
    const d = (c.case_date || "").split("T")[0];
    if (!d) return acc;
    acc[d] = (acc[d] || 0) + (c.case_count || 1);
    return acc;
  }, {});
  const trendData = Object.entries(casesByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, cases]) => ({ date, cases }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Municipal Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Strategic health and sanitation insights for LGU leadership
        </p>
      </div>

      {hasError && (
        <Card className="glass-card border-destructive/50">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">
              Some data could not be loaded. Showing available statistics.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="glass-card">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Citizens Registered</p>
                <p className="text-lg font-bold">{totalCitizens}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Service Requests</p>
                <p className="text-lg font-bold">{totalRequests}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4 flex items-center gap-3">
              <Syringe className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Vaccinations Administered</p>
                <p className="text-lg font-bold">{totalVaccinations}</p>
                <p className="text-[11px] text-muted-foreground">{completedVaccinations} completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4 flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Disease Cases (Total / Active)</p>
                <p className="text-lg font-bold">{totalDiseaseCases} / {activeDiseaseCases}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card lg:col-span-2 lg:col-start-1">
            <CardContent className="pt-4 flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Establishment Compliance Rate</p>
                <p className="text-lg font-bold">{complianceRate}%</p>
                <p className="text-[11px] text-muted-foreground">
                  {compliantEstablishments} of {establishments.length} establishments
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading">Requests by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {reqChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No request data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reqChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading">Establishment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {permitChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No establishment data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={permitChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {permitChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
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
              <p className="text-sm text-muted-foreground py-8 text-center">No disease case data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={diseaseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="cases" fill="hsl(var(--chart-red))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading">Disease Case Trends (Last 14 Dates)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No trend data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="cases" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LguAnalytics;
