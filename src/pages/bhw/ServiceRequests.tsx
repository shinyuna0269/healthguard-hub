import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Send, Search } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";

const requestTypes = [
  "Health Consultation",
  "Vaccination Appointment",
  "Disease Report",
  "Sanitation Complaint",
];

const BhwServiceRequests = () => {
  const { user } = useAuth();
  const [citizenId, setCitizenId] = useState("");
  const [type, setType] = useState(requestTypes[0]);
  const [customType, setCustomType] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["bhw_service_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const finalType = type === "Other" && customType ? customType : type;
      const { error } = await supabase.from("service_requests").insert({
        user_id: user!.id,
        request_type: finalType,
        title: `${finalType} (assisted)`,
        description: `Citizen ID: ${citizenId || "N/A"} — ${description}`,
        status: "Submitted",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bhw_service_requests"] });
      setCitizenId("");
      setType(requestTypes[0]);
      setCustomType("");
      setDescription("");
      toast.success("Assisted request submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.request_type.toLowerCase().includes(q) ||
        (r.status || "").toLowerCase().includes(q),
    );
  }, [requests, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Assisted Requests</h1>
          <p className="text-sm text-muted-foreground">
            Submit requests for citizens who do not have access to the online portal and track their status.
          </p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Submit Request for Citizen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Citizen ID (if available)</Label>
              <Input
                placeholder="GSMS-2026-XXXXXXXX"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Request Type</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {[...requestTypes, "Other"].map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {type === "Other" && (
            <div>
              <Label className="text-xs">Custom Request Type</Label>
              <Input
                placeholder="Specify request type"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
              />
            </div>
          )}
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={2}
              placeholder="Describe the citizen's concern or request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            className="gap-1"
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !description || (type === "Other" && !customType)}
          >
            <Send className="h-4 w-4" /> Submit Request
          </Button>
          <p className="text-[11px] text-muted-foreground pt-1">
            Requests are routed automatically to the appropriate module (health center, vaccination, sanitation, or
            surveillance) based on the request type.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> Requests in Barangay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by type or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 max-w-xs"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No assisted requests recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">{r.request_type}</TableCell>
                    <TableCell className="text-sm">{r.title}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">
                      <StatusBadge status={r.status} />
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

export default BhwServiceRequests;

