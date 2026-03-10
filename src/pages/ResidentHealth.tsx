import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const ResidentHealth = () => {
  const { user } = useAuth();

  const { data: records = [] } = useQuery({
    queryKey: ["resident_health_records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("resident_health_records").select("*").order("record_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">My Family Health Records</h1>
        <p className="text-sm text-muted-foreground">View your personal and family health history</p>
      </div>
      <Card className="glass-card">
        <CardContent className="pt-6">
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No health records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Diagnosis</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Medicine</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Provider</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.record_date}</TableCell>
                    <TableCell className="text-sm">{r.record_type}</TableCell>
                    <TableCell className="text-sm">{r.diagnosis}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{r.medicine}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{r.provider}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentHealth;
