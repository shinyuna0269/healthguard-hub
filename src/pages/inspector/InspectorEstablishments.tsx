import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RecordDetailModal, { type DetailField } from "@/components/RecordDetailModal";
import StatusBadge from "@/components/StatusBadge";
import { Building2, Search } from "lucide-react";

type EstablishmentRow = {
  id: string;
  business_name: string;
  owner_name: string;
  business_type: string | null;
  barangay: string | null;
  status: string;
};

type AppRow = {
  id: string;
  establishment_id: string;
  establishment_name: string;
  barangay: string | null;
};

type InspectionRow = {
  id: string;
  application_id: string;
  scheduled_date: string | null;
  completed_at: string | null;
  status: string;
  result: string | null;
};

const InspectorEstablishments = () => {
  const { user, loading } = useAuth();
  const [searchName, setSearchName] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterPermitStatus, setFilterPermitStatus] = useState("");
  const [selectedEst, setSelectedEst] = useState<EstablishmentRow | null>(null);

  const { data: establishments = [], isLoading: establishmentsLoading, error: establishmentsError } = useQuery({
    queryKey: ["inspector_establishments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("establishments")
        .select("id,business_name,owner_name,business_type,barangay,status")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as EstablishmentRow[];
    },
    enabled: !loading && !!user,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["inspector_sanitary_apps_for_establishments"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sanitary_permit_applications")
        .select("id,establishment_id,establishment_name,barangay")
        .order("applied_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []) as AppRow[];
    },
    enabled: !loading && !!user,
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ["inspector_sanitary_inspections_for_establishments"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sanitary_inspections")
        .select("id,application_id,scheduled_date,completed_at,status,result")
        .order("scheduled_date", { ascending: false })
        .limit(3000);
      if (error) throw error;
      return (data || []) as InspectionRow[];
    },
    enabled: !loading && !!user,
  });

  const barangays = useMemo(() => {
    return [...new Set(establishments.map((e) => e.barangay).filter(Boolean) as string[])].sort();
  }, [establishments]);

  const permitStatuses = useMemo(() => {
    return [...new Set(establishments.map((e) => e.status).filter(Boolean))].sort();
  }, [establishments]);

  const appsByEst = useMemo(() => {
    const m = new Map<string, AppRow[]>();
    applications.forEach((a) => {
      const list = m.get(a.establishment_id) || [];
      list.push(a);
      m.set(a.establishment_id, list);
    });
    return m;
  }, [applications]);

  const lastInspectionDateByEst = useMemo(() => {
    const appIdToEst = new Map<string, string>();
    applications.forEach((a) => appIdToEst.set(a.id, a.establishment_id));

    const best: Record<string, string> = {};
    inspections.forEach((i) => {
      const estId = appIdToEst.get(i.application_id);
      if (!estId) return;
      const d = i.completed_at ? i.completed_at.slice(0, 10) : i.scheduled_date || "";
      if (!d) return;
      if (!best[estId] || d > best[estId]) best[estId] = d;
    });
    return best;
  }, [applications, inspections]);

  const filtered = useMemo(() => {
    const q = searchName.trim().toLowerCase();
    return establishments.filter((e) => {
      if (q && !(e.business_name || "").toLowerCase().includes(q)) return false;
      if (filterBarangay && (e.barangay || "") !== filterBarangay) return false;
      if (filterPermitStatus && e.status !== filterPermitStatus) return false;
      return true;
    });
  }, [establishments, searchName, filterBarangay, filterPermitStatus]);

  const historyForSelected = useMemo(() => {
    if (!selectedEst) return [];
    const apps = appsByEst.get(selectedEst.id) || [];
    const appIds = new Set(apps.map((a) => a.id));
    return inspections
      .filter((i) => appIds.has(i.application_id))
      .sort((a, b) => String(b.scheduled_date || "").localeCompare(String(a.scheduled_date || "")));
  }, [appsByEst, inspections, selectedEst]);

  const detailsFields = (e: EstablishmentRow): DetailField[] => [
    { label: "Establishment", value: e.business_name },
    { label: "Owner", value: e.owner_name },
    { label: "Type", value: e.business_type },
    { label: "Barangay", value: e.barangay },
    { label: "Permit Status", value: e.status, isStatus: true },
    { label: "Last Inspection Date", value: lastInspectionDateByEst[e.id] || "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Establishment List</h1>
        <p className="text-sm text-muted-foreground">All registered establishments (municipality-wide)</p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Establishments
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search establishment name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="h-8 w-64"
              />
            </div>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={filterBarangay}
              onChange={(e) => setFilterBarangay(e.target.value)}
            >
              <option value="">All barangays</option>
              {barangays.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={filterPermitStatus}
              onChange={(e) => setFilterPermitStatus(e.target.value)}
            >
              <option value="">All permit statuses</option>
              {permitStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setSearchName("");
                setFilterBarangay("");
                setFilterPermitStatus("");
              }}
            >
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {establishmentsLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading establishments...</p>
          ) : establishmentsError ? (
            <p className="text-sm text-destructive py-6 text-center">Failed to load establishments.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No establishments found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Establishment</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Owner</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Type</TableHead>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs">Permit Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Last Inspection</TableHead>
                  <TableHead className="text-xs w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm font-medium">{e.business_name}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{e.owner_name}</TableCell>
                    <TableCell className="text-sm hidden lg:table-cell">{e.business_type || "—"}</TableCell>
                    <TableCell className="text-sm">{e.barangay || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={e.status} />
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell">
                      {lastInspectionDateByEst[e.id] || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setSelectedEst(e)}
                      >
                        View history
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RecordDetailModal
        open={!!selectedEst}
        onOpenChange={(open) => !open && setSelectedEst(null)}
        title="Establishment Inspection History"
        fields={selectedEst ? detailsFields(selectedEst) : []}
        attachments={null}
        referralDestination={null}
      />

      {selectedEst && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading">
              Inspection History for {selectedEst.business_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyForSelected.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No inspection history found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Inspection</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyForSelected.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="text-xs font-mono">{i.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{i.scheduled_date || "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={i.status} />
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{i.result || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InspectorEstablishments;

