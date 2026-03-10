import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const ResidentPermits = () => {
  const { user } = useAuth();

  const { data: permits = [] } = useQuery({
    queryKey: ["resident_permits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("resident_permits").select("*").order("application_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">My Business Permits</h1>
        <p className="text-sm text-muted-foreground">Track your sanitation permit applications</p>
      </div>
      <Card className="glass-card">
        <CardContent className="pt-6">
          {permits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No permit applications found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Business</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Applied</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permits.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">{p.business_name}</TableCell>
                    <TableCell className="text-sm">{p.business_type}</TableCell>
                    <TableCell className="text-sm">{p.application_date}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
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

export default ResidentPermits;
