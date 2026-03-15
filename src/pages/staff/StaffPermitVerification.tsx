import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Search, CheckCircle2, AlertCircle, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  pending_verification: "Pending Verification",
  registered: "Registered",
  requires_correction: "Requires Correction",
  rejected: "Rejected",
};

const StaffPermitVerification = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [actionDialog, setActionDialog] = useState<"approve" | "reject" | "correction" | null>(null);
  const [selectedEstablishment, setSelectedEstablishment] = useState<{ id: string; business_name: string } | null>(null);
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();

  const { data: establishments = [] } = useQuery({
    queryKey: ["staff_establishments_verification"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return establishments;
    return establishments.filter(
      (e) =>
        e.business_name.toLowerCase().includes(q) ||
        (e.business_type || "").toLowerCase().includes(q) ||
        (e.barangay || "").toLowerCase().includes(q),
    );
  }, [establishments, search]);

  const pendingCount = useMemo(() => establishments.filter((e) => e.status === "pending_verification").length, [establishments]);

  const verifyMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      reviewer_notes,
    }: {
      id: string;
      status: string;
      reviewer_notes: string | null;
    }) => {
      const { error } = await supabase
        .from("establishments")
        .update({
          status,
          reviewer_notes: reviewer_notes || null,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      const { data: notif } = await supabase.from("establishment_notifications").select("id").eq("establishment_id", id).maybeSingle();
      if (notif) {
        await supabase.from("establishment_notifications").update({ read_by_clerk: true, read_by_bsi: true }).eq("id", notif.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_establishments_verification"] });
      setActionDialog(null);
      setSelectedEstablishment(null);
      setNote("");
      toast.success("Verification status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openAction = (establishment: { id: string; business_name: string }, action: "approve" | "reject" | "correction") => {
    setSelectedEstablishment(establishment);
    setActionDialog(action);
    setNote("");
  };

  const submitAction = () => {
    if (!selectedEstablishment) return;
    if ((actionDialog === "reject" || actionDialog === "correction") && !note.trim()) {
      toast.error(actionDialog === "reject" ? "Please provide a reason for rejection." : "Please provide a note on why correction is needed.");
      return;
    }
    const status =
      actionDialog === "approve" ? "registered" : actionDialog === "reject" ? "rejected" : "requires_correction";
    verifyMutation.mutate({
      id: selectedEstablishment.id,
      status,
      reviewer_notes: note.trim() || (actionDialog === "approve" ? "Establishment approved." : null),
    });
  };

  const getPermitDocUrl = async (path: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  const handleViewPermit = async (path: string | null) => {
    if (!path) return;
    const url = await getPermitDocUrl(path);
    if (url) window.open(url, "_blank");
    else toast.error("Could not load document.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Establishment Registration Verification</h1>
        <p className="text-sm text-muted-foreground">
          Verify business permit authenticity, ownership, validity, and that the address is within the LGU. Notified when citizens submit new registrations.
        </p>
        {pendingCount > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount} establishment(s) pending verification.
          </p>
        )}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search business name, type, or barangay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No establishments found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Business</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Type</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Barangay</TableHead>
                  <TableHead className="text-xs">Permit</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-56">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm font-medium">{e.business_name}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{e.business_type || "—"}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{e.barangay || "—"}</TableCell>
                    <TableCell>
                      {e.permit_document_url ? (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleViewPermit(e.permit_document_url)}>
                          <FileText className="h-3 w-3" /> View
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={STATUS_LABELS[e.status] || e.status} />
                    </TableCell>
                    <TableCell>
                      {e.status === "pending_verification" && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs"
                            onClick={() => openAction(e, "approve")}
                            disabled={verifyMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs"
                            onClick={() => openAction(e, "reject")}
                            disabled={verifyMutation.isPending}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs"
                            onClick={() => openAction(e, "correction")}
                            disabled={verifyMutation.isPending}
                          >
                            <AlertCircle className="h-3.5 w-3.5 mr-1" />
                            Request Correction
                          </Button>
                        </div>
                      )}
                      {e.status !== "pending_verification" && e.reviewer_notes && (
                        <span className="text-xs text-muted-foreground line-clamp-1" title={e.reviewer_notes}>
                          {e.reviewer_notes}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!actionDialog} onOpenChange={(open) => !open && setActionDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {actionDialog === "approve" && "Approve Establishment"}
              {actionDialog === "reject" && "Reject Establishment"}
              {actionDialog === "correction" && "Request Correction"}
            </DialogTitle>
          </DialogHeader>
          {selectedEstablishment && (
            <>
              <p className="text-sm text-muted-foreground">{selectedEstablishment.business_name}</p>
              {actionDialog === "approve" && (
                <div>
                  <Label className="text-xs">Optional message to applicant</Label>
                  <Textarea
                    placeholder="e.g. Establishment was approved."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              )}
              {actionDialog === "reject" && (
                <div>
                  <Label className="text-xs">Reason for rejection *</Label>
                  <Textarea
                    placeholder="Type why the establishment is rejected..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}
              {actionDialog === "correction" && (
                <div>
                  <Label className="text-xs">Note on why correction is needed *</Label>
                  <Textarea
                    placeholder="Type what needs to be corrected..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setActionDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={submitAction} disabled={verifyMutation.isPending || ((actionDialog === "reject" || actionDialog === "correction") && !note.trim())}>
                  {verifyMutation.isPending ? "Saving..." : "Submit"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPermitVerification;
