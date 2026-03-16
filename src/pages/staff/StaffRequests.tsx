import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const StaffRequests = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["staff_incoming_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.request_type.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q),
    );
  }, [requests, search]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("service_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_incoming_requests"] });
      toast.success("Request status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Assisted Request & Tracking</h1>
        <p className="text-sm text-muted-foreground">View and update request status for citizens and BHW-assisted requests</p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search request type, title, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-xs w-44">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{r.request_type}</TableCell>
                    <TableCell className="text-sm">{r.title}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs"
                          onClick={() => updateMutation.mutate({ id: r.id, status: "Under Review" })}
                          disabled={updateMutation.isPending}
                        >
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          Under Review
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => updateMutation.mutate({ id: r.id, status: "Completed" })}
                          disabled={updateMutation.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Complete
                        </Button>
                      </div>
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

export default StaffRequests;

