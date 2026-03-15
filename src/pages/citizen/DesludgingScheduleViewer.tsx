import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Search, Bell } from "lucide-react";

const DesludgingScheduleViewer = () => {
  const [search, setSearch] = useState("");

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["desludging_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("desludging_schedules")
        .select("*")
        .gte("schedule_date", new Date().toISOString().slice(0, 10))
        .order("schedule_date", { ascending: true })
        .order("barangay")
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schedules;
    return schedules.filter(
      (s) => (s.barangay || "").toLowerCase().includes(q) || (s.notes || "").toLowerCase().includes(q)
    );
  }, [schedules, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Desludging Schedule Viewer</h1>
        <p className="text-sm text-muted-foreground">View city desludging schedule by barangay and upcoming sanitation operations</p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by barangay or notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading schedule...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming desludging schedules. Check with your barangay or the City Sanitation Office.</p>
              <p className="text-xs text-muted-foreground mt-1">You can receive reminders when new schedules are posted for your barangay.</p>
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
