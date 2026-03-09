import { useRole } from "@/contexts/RoleContext";
import StatCard from "@/components/StatCard";
import HealthIndexMeter from "@/components/HealthIndexMeter";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Stethoscope,
  Syringe,
  AlertTriangle,
  ClipboardCheck,
  Droplets,
  Activity,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const consultationData = [
  { month: "Jan", cases: 120 },
  { month: "Feb", cases: 98 },
  { month: "Mar", cases: 145 },
  { month: "Apr", cases: 130 },
  { month: "May", cases: 165 },
  { month: "Jun", cases: 142 },
];

const diseaseData = [
  { month: "Jan", dengue: 12, tb: 5, flu: 45 },
  { month: "Feb", dengue: 8, tb: 7, flu: 32 },
  { month: "Mar", dengue: 15, tb: 4, flu: 28 },
  { month: "Apr", dengue: 22, tb: 6, flu: 19 },
  { month: "May", dengue: 18, tb: 3, flu: 15 },
  { month: "Jun", dengue: 25, tb: 5, flu: 22 },
];

const vaccinationPie = [
  { name: "Fully Vaccinated", value: 72, color: "hsl(152, 60%, 40%)" },
  { name: "Partial", value: 18, color: "hsl(38, 92%, 50%)" },
  { name: "Not Vaccinated", value: 10, color: "hsl(0, 72%, 51%)" },
];

const recentActivities = [
  { action: "New consultation recorded", module: "Health Center", time: "5 min ago", status: "completed" },
  { action: "Sanitation inspection scheduled", module: "Sanitation", time: "12 min ago", status: "scheduled" },
  { action: "Dengue case reported in Purok 3", module: "Surveillance", time: "30 min ago", status: "critical" },
  { action: "Vaccination drive completed", module: "Immunization", time: "1 hr ago", status: "completed" },
  { action: "Wastewater complaint filed", module: "Wastewater", time: "2 hrs ago", status: "pending" },
];

const Dashboard = () => {
  const { currentRole } = useRole();
  const isCaptain = currentRole === "Captain_User";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Municipal health overview and analytics</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Consultations"
          value="1,284"
          icon={Stethoscope}
          trend={{ value: 12.5, label: "vs last month" }}
        />
        <StatCard
          title="Active Cases"
          value="47"
          icon={AlertTriangle}
          description="Under surveillance"
          trend={{ value: -8, label: "vs last month" }}
        />
        <StatCard
          title="Vaccinations"
          value="3,891"
          icon={Syringe}
          trend={{ value: 5.2, label: "vs last month" }}
        />
        <StatCard
          title="Sanitation Permits"
          value="156"
          icon={ClipboardCheck}
          description="23 pending review"
        />
      </div>

      {/* Health Index + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {isCaptain && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle className="text-sm font-heading">Community Health Index</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <HealthIndexMeter score={73} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card className={`glass-card ${isCaptain ? "lg:col-span-2" : "lg:col-span-2"}`}>
          <CardHeader>
            <CardTitle className="text-sm font-heading">Monthly Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={consultationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {!isCaptain && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-heading">Vaccination Coverage</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={vaccinationPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {vaccinationPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Disease Trends + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-heading">Disease Surveillance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={diseaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="dengue" stroke="hsl(var(--chart-red))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tb" stroke="hsl(var(--chart-orange))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="flu" stroke="hsl(var(--chart-blue))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="w-3 h-0.5 bg-destructive inline-block" />Dengue</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="w-3 h-0.5 bg-warning inline-block" />TB</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="w-3 h-0.5 bg-info inline-block" />Flu</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-heading">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.module} · {activity.time}</p>
                  </div>
                  <StatusBadge status={activity.status} />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
