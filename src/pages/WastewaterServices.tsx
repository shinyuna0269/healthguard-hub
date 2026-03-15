import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const WastewaterServices = () => {
  const { currentRole } = useAuth();
  const [search, setSearch] = useState("");

  const { data: complaints = [] } = useQuery({
    queryKey: ["sanitation_complaints_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sanitation_complaints")
        .select("*")
        .order("date_submitted", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const isResident = currentRole === "Citizen_User" || currentRole === "BusinessOwner_User";
  const filtered = complaints.filter(
    (c) =>
      (c.complaint_type || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.barangay || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Wastewater & Sanitation</h1>
          <p className="text-sm text-muted-foreground">
            {isResident ? "Submit complaints from the Citizen Sanitation Complaints page." : "Unified sanitation complaints (BHW & Inspector)."}
          </p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by type, barangay, description..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Barangay</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Description</TableHead>
                {!isResident && <TableHead className="text-xs hidden lg:table-cell">Assigned</TableHead>}
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.complaint_id}>
                  <TableCell className="text-sm">{c.date_submitted}</TableCell>
                  <TableCell className="font-medium text-sm">{c.complaint_type}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{c.barangay}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell max-w-[200px] truncate">{c.description || "—"}</TableCell>
                  {!isResident && <TableCell className="text-sm hidden lg:table-cell">{c.assigned_officer || "—"}</TableCell>}
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default WastewaterServices;
