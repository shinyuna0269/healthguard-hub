import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Syringe, Search } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QC_BARANGAYS } from "@/lib/constants";

const BhwVaccinationRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [citizenInput, setCitizenInput] = useState("");
  const [selectedCitizen, setSelectedCitizen] = useState<{
    user_id: string;
    full_name: string | null;
    barangay?: string | null;
  } | null>(null);
  const [childName, setChildName] = useState("");
  const [scheduleDate, setScheduleDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [vaccine, setVaccine] = useState("BCG");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vaccineFilter, setVaccineFilter] = useState<string>("all");
  const [barangayFilter, setBarangayFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const citizenPrefix = useMemo(() => {
    const v = citizenInput.trim();
    if (!v) return "";
    return v.replace("GSMS-2026-", "").toLowerCase();
  }, [citizenInput]);

  useEffect(() => {
    if (selectedCitizen?.full_name) {
      setChildName(selectedCitizen.full_name);
    }
  }, [selectedCitizen]);

  const { data: citizenSuggestions = [] } = useQuery({
    queryKey: ["bhw_vax_citizen_suggest", citizenPrefix],
    queryFn: async () => {
      if (!citizenPrefix || citizenPrefix.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, barangay")
        .ilike("user_id", `${citizenPrefix}%`)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!citizenPrefix && citizenPrefix.length >= 2,
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["bhw_vaccinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vaccinations")
        .select("*")
        .order("vaccination_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const filteredVaccinations = useMemo(() => {
    let list = vaccinations as any[];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((v) => {
        const name = (v.patient_name || v.child_name || "").toLowerCase();
        return (
          name.includes(q) ||
          (v.vaccine || "").toLowerCase().includes(q) ||
          (v.status || "").toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== "all") {
      list = list.filter(
        (v) => (v.status || "").toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    if (vaccineFilter !== "all") {
      list = list.filter((v) => (v.vaccine || "") === vaccineFilter);
    }

    if (barangayFilter !== "all") {
      list = list.filter((v) => (v.barangay || "") === barangayFilter);
    }

    if (dateFilter) {
      list = list.filter((v) =>
        (v.vaccination_date || "").startsWith(dateFilter),
      );
    }

    return list;
  }, [vaccinations, search, statusFilter, vaccineFilter, barangayFilter, dateFilter]);

  const displayChildName = childName.trim() || selectedCitizen?.full_name?.trim() || "";
  const canSubmitVaccination = displayChildName.length > 0 && scheduleDate.length > 0 && user;

  const requestMutation = useMutation({
    mutationFn: async () => {
      const name = displayChildName;
      const vaccination_date = scheduleDate.slice(0, 10);

      const payload = {
        child_name: name,
        vaccine,
        vaccination_date,
        status: "scheduled",
        recorded_by: user!.id,
      };
      const { error } = await supabase.from("vaccinations").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bhw_vaccinations"] });
      setCitizenInput("");
      setSelectedCitizen(null);
      setChildName("");
      setScheduleDate(new Date().toISOString().slice(0, 10));
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
              <Label className="text-xs">Citizen ID (optional)</Label>
              <Input
                placeholder="GSMS-2026-XXXXXXXX"
                value={citizenInput}
                onChange={(e) => {
                  setCitizenInput(e.target.value);
                  setSelectedCitizen(null);
                }}
              />
              {citizenSuggestions.length > 0 && (
                <div className="mt-1 rounded-md border border-border bg-background max-h-40 overflow-y-auto text-xs">
                  {citizenSuggestions.map((c: any) => (
                    <button
                      key={c.user_id}
                      type="button"
                      className="w-full text-left px-2 py-1 hover:bg-muted"
                      onClick={() => {
                        const formattedId = `GSMS-2026-${c.user_id}`;
                        setCitizenInput(formattedId);
                        setSelectedCitizen(c);
                      }}
                    >
                      <div className="font-medium truncate">
                        {c.full_name || "Citizen"}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {c.user_id} · {c.barangay || "No barangay"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Child / Citizen Name *</Label>
              <Input
                placeholder="Full name (required)"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Schedule Date *</Label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            disabled={requestMutation.isPending || !canSubmitVaccination}
          >
            <Send className="h-4 w-4" /> Submit Vaccination Request
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <Syringe className="h-4 w-4 text-primary" /> All Vaccination Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search by name, vaccine, or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 max-w-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vaccineFilter} onValueChange={setVaccineFilter}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Vaccine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All vaccines</SelectItem>
                {["BCG", "Hepatitis B", "Pentavalent", "OPV", "IPV", "PCV", "MMR", "Flu"].map(
                  (v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Select value={barangayFilter} onValueChange={setBarangayFilter}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Barangay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All barangays</SelectItem>
                {QC_BARANGAYS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-8 w-[150px]"
            />
          </div>
          {filteredVaccinations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No vaccination records.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Child Name</TableHead>
                  <TableHead className="text-xs">Vaccine Type</TableHead>
                  <TableHead className="text-xs">Schedule Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVaccinations.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm">
                      {v.patient_name || v.child_name || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{v.vaccine}</TableCell>
                    <TableCell className="text-sm">{v.vaccination_date}</TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString() : "—"}
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

