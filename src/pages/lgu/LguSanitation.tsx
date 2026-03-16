import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Building2, ClipboardCheck, Search } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const LguSanitation = () => {
  const [searchEstablishment, setSearchEstablishment] = useState("");
  const [searchInspection, setSearchInspection] = useState("");

  const { data: establishments = [], isLoading: establishmentsLoading } = useQuery({
    queryKey: ["lgu_establishments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["lgu_sanitary_applications"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sanitary_permit_applications")
        .select("id, establishment_id, establishment_name, status")
        .order("applied_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: inspectionsRaw = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ["lgu_sanitary_inspections"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sanitary_inspections")
        .select("*")
        .order("scheduled_date", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data || [];
    },
  });

  const appById = useMemo(() => {
    const m: Record<string, { establishment_name?: string; establishment_id?: string; status?: string }> = {};
    applications.forEach((a: any) => {
      m[a.id] = { establishment_name: a.establishment_name, establishment_id: a.establishment_id, status: a.status };
    });
    return m;
  }, [applications]);

  const inspections = useMemo(() => {
    return inspectionsRaw.map((i: any) => ({
      ...i,
      establishment_name: appById[i.application_id]?.establishment_name ?? "—",
    }));
  }, [inspectionsRaw, appById]);

  const filteredEstablishments = useMemo(() => {
    const q = searchEstablishment.trim().toLowerCase();
    if (!q) return establishments;
    return establishments.filter(
      (e) =>
        (e.business_name || "").toLowerCase().includes(q) ||
        (e.barangay || "").toLowerCase().includes(q) ||
        (e.business_type || "").toLowerCase().includes(q) ||
        (e.status || "").toLowerCase().includes(q),
    );
  }, [establishments, searchEstablishment]);

  const filteredInspections = useMemo(() => {
    const q = searchInspection.trim().toLowerCase();
    if (!q) return inspections;
    return inspections.filter(
      (i) =>
        (i.establishment_name || "").toLowerCase().includes(q) ||
        (i.status || "").toLowerCase().includes(q) ||
        (i.result || "").toLowerCase().includes(q) ||
        (i.findings || "").toLowerCase().includes(q),
    );
  }, [inspections, searchInspection]);

  const complianceCount = useMemo(
    () => establishments.filter((e) => (e.status || "").toLowerCase() === "registered").length,
    [establishments],
  );
  const totalEstablishments = establishments.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Establishment Compliance</h1>
        <p className="text-sm text-muted-foreground">
          Inspection records, establishment compliance status, and inspection results
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Establishments</p>
              <p className="text-lg font-bold">{totalEstablishments}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Compliant (Registered)</p>
              <p className="text-lg font-bold">{complianceCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Compliance Rate</p>
              <p className="text-lg font-bold">
                {totalEstablishments ? Math.round((complianceCount / totalEstablishments) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Establishment compliance table */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Establishment Compliance Status
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search business, barangay, type, status..."
              value={searchEstablishment}
              onChange={(e) => setSearchEstablishment(e.target.value)}
              className="h-8 max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {establishmentsLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
          ) : filteredEstablishments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No establishments found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Business</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Type</TableHead>
                  <TableHead className="text-xs">Barangay</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstablishments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm font-medium">{e.business_name}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{e.business_type || "—"}</TableCell>
                    <TableCell className="text-sm">{e.barangay || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={e.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Inspection records table */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" /> Inspection Records
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search establishment, status, result..."
              value={searchInspection}
              onChange={(e) => setSearchInspection(e.target.value)}
              className="h-8 max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {inspectionsLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading inspections...</p>
          ) : filteredInspections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No inspection records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Establishment</TableHead>
                  <TableHead className="text-xs">Scheduled Date</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Completed</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Result</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Findings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell className="text-sm font-medium">{i.establishment_name}</TableCell>
                    <TableCell className="text-sm">{i.scheduled_date ?? "—"}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">
                      {i.completed_at ? new Date(i.completed_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={i.status} />
                    </TableCell>
                    <TableCell className="text-sm hidden lg:table-cell truncate max-w-[140px]">
                      {i.result ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm hidden lg:table-cell truncate max-w-[160px]">
                      {i.findings ?? "—"}
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

export default LguSanitation;
