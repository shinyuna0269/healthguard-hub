import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Syringe } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";

const BhwVaccinationRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [citizenId, setCitizenId] = useState("");
  const [vaccine, setVaccine] = useState("BCG");
  const [notes, setNotes] = useState("");

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["bhw_vaccinations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vaccinations")
        .select("*")
        .order("vaccination_date", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_requests").insert({
        user_id: user!.id,
        request_type: "Vaccination",
        title: `Vaccination Request — ${vaccine}`,
        description: `Citizen ID: ${citizenId || "N/A"} — ${notes}`,
        status: "Submitted",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bhw_vaccinations"] });
      setCitizenId("");
      setNotes("");
      toast.success("Vaccination request submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Vaccination Requests</h1>
        <p className="text-sm text-muted-foreground">
          Assist citizens with vaccination scheduling and monitor recent vaccination activities.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <Syringe className="h-4 w-4 text-primary" /> Assist Vaccination Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Citizen ID</Label>
              <Input
                placeholder="GSMS-2026-XXXXXXXX"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Vaccine Type</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                value={vaccine}
                onChange={(e) => setVaccine(e.target.value)}
              >
                {["BCG", "Hepatitis B", "Pentavalent", "OPV", "IPV", "PCV", "MMR", "Flu"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <Button
            size="sm"
            className="gap-1"
            onClick={() => requestMutation.mutate()}
            disabled={requestMutation.isPending}
          >
            <Send className="h-4 w-4" /> Submit Vaccination Request
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <Syringe className="h-4 w-4 text-primary" /> Vaccination Schedule (Recent)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vaccinations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No vaccination records.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Patient Name</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Patient Type</TableHead>
                  <TableHead className="text-xs">Vaccine</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vaccinations.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm">{v.vaccination_date}</TableCell>
                    <TableCell className="text-sm">{v.child_name}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{"—"}</TableCell>
                    <TableCell className="text-sm">{v.vaccine}</TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
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

export default BhwVaccinationRequests;

