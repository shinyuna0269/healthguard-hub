import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Search, Bell } from "lucide-react";

const DesludgingScheduleViewer = () => {
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["desludging_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("desludging_schedules")
        .select("*")
        .order("schedule_date", { ascending: true })
        .order("barangay")
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const months = useMemo(() => {
    const set = new Set<string>();
    const today = new Date();
    schedules.forEach((s) => {
      if (s.schedule_date) {
        const d = new Date(s.schedule_date + "T12:00:00");
        set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
    });
    return Array.from(set).sort();
  }, [schedules]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let list = schedules;

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          (s.barangay || "").toLowerCase().includes(q) ||
          (s.notes || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter === "upcoming") {
      list = list.filter((s) => (s.schedule_date || "") >= today);
    } else if (statusFilter === "completed") {
      list = list.filter((s) => (s.schedule_date || "") < today);
    }

    if (monthFilter && monthFilter !== "all") {
      list = list.filter((s) => {
        if (!s.schedule_date) return false;
        const d = new Date(s.schedule_date + "T12:00:00");
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return key === monthFilter;
      });
    }

    return list;
  }, [schedules, search, statusFilter, monthFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Desludging Schedule Viewer</h1>
        <p className="text-sm text-muted-foreground">View city desludging schedule by barangay and upcoming sanitation operations</p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search Barangay"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-[200px]"
              />
            </div>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {months.map((m) => {
                  const [y, mo] = m.split("-");
                  const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString("default", { month: "long", year: "numeric" });
                  return (
                    <SelectItem key={m} value={m}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading schedule...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No desludging schedules match your filters.</p>
              <p className="text-xs text-muted-foreground mt-1">Try changing the search or filters, or check with your barangay or the City Sanitation Office.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs">Schedule Date</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-sm">{s.barangay}</TableCell>
                    <TableCell className="text-sm">{s.schedule_date}</TableCell>
                    <TableCell className="text-sm">{s.schedule_time || "—"}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell text-muted-foreground">{s.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/20">
        <CardContent className="pt-6 flex items-start gap-3">
          <Bell className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Reminders</p>
            <p className="text-muted-foreground">When desludging schedules are added for your barangay, you can receive reminders. Ensure your septic desludging request is submitted ahead of the schedule date.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesludgingScheduleViewer;
