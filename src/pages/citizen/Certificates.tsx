import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import RecordDetailModal from "@/components/RecordDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Award, Download } from "lucide-react";

const Certificates = () => {
  const { user } = useAuth();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: certificates = [] } = useQuery({
    queryKey: ["citizen_certificates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("certificates").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Certificates</h1>
        <p className="text-sm text-muted-foreground">View and download your sanitary permit certificates</p>
      </div>

      {selectedRecord && (
        <RecordDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Certificate Details"
          fields={[
            { label: "Certificate #", value: selectedRecord.certificate_number },
            { label: "Type", value: selectedRecord.certificate_type },
            { label: "Issued Date", value: selectedRecord.issued_date },
            { label: "Expiry Date", value: selectedRecord.expiry_date },
            { label: "Status", value: selectedRecord.status, isStatus: true },
            { label: "Created", value: new Date(selectedRecord.created_at).toLocaleDateString() },
          ]}
        />
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">My Certificates</CardTitle></CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No certificates issued yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Certificate #</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Issued</TableHead>
                  <TableHead className="text-xs">Expiry</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRecord(c); setDetailOpen(true); }}>
                    <TableCell className="font-mono text-sm">{c.certificate_number || "—"}</TableCell>
                    <TableCell className="text-sm">{c.certificate_type}</TableCell>
                    <TableCell className="text-sm">{c.issued_date || "—"}</TableCell>
                    <TableCell className="text-sm">{c.expiry_date || "—"}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell onClick={ev => ev.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs"><Download className="h-3 w-3" /> Download</Button>
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

export default Certificates;
