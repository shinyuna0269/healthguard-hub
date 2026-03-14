import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import RecordDetailModal from "@/components/RecordDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const Payments = () => {
  const { user } = useAuth();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: payments = [] } = useQuery({
    queryKey: ["citizen_payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Payments</h1>
        <p className="text-sm text-muted-foreground">View payment history and download receipts</p>
      </div>

      {selectedRecord && (
        <RecordDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Payment Details"
          fields={[
            { label: "Reference #", value: selectedRecord.reference_number },
            { label: "Type", value: selectedRecord.payment_type },
            { label: "Amount", value: `₱${Number(selectedRecord.amount).toLocaleString()}` },
            { label: "Status", value: selectedRecord.status, isStatus: true },
            { label: "Paid At", value: selectedRecord.paid_at ? new Date(selectedRecord.paid_at).toLocaleDateString() : null },
            { label: "Created", value: new Date(selectedRecord.created_at).toLocaleDateString() },
          ]}
        />
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">Payment History</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No payment records found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Reference</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRecord(p); setDetailOpen(true); }}>
                    <TableCell className="font-mono text-sm">{p.reference_number || "—"}</TableCell>
                    <TableCell className="text-sm">{p.payment_type}</TableCell>
                    <TableCell className="text-sm">₱{Number(p.amount).toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell onClick={ev => ev.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs"><Download className="h-3 w-3" /> Receipt</Button>
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

export default Payments;
