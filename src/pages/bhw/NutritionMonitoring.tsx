import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartPulse, Search } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QC_BARANGAYS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

const BhwNutritionMonitoring = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [status, setStatus] = useState("Normal");
  const [monitoringDate, setMonitoringDate] = useState("");
  const [barangay, setBarangay] = useState<string>(QC_BARANGAYS[0]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [barangayFilter, setBarangayFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const { data: nutrition = [] } = useQuery({
    queryKey: ["bhw_nutrition"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nutrition_records")
        .select("*")
        .order("monitoring_date", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("nutrition_records").insert({
        child_name: childName,
        age: age || null,
        height_cm: height || null,
        weight_kg: weight || null,
        nutritional_status: status,
        monitoring_date: monitoringDate || new Date().toISOString().slice(0, 10),
        barangay,
        bhw_user_id: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bhw_nutrition"] });
      setChildName("");
      setAge("");
      setHeight("");
      setWeight("");
      setStatus("Normal");
      setMonitoringDate("");
    },
  });

  const filtered = useMemo(() => {
    let list = nutrition as any[];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((n) =>
        (n.child_name || "").toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      list = list.filter(
        (n) =>
          (n.nutritional_status || "").toLowerCase() ===
          statusFilter.toLowerCase(),
      );
    }

    if (barangayFilter !== "all") {
      list = list.filter((n) => (n.barangay || "") === barangayFilter);
    }

    if (ageFilter !== "all") {
      list = list.filter((n) => {
        const ageNum = Number(n.age || 0);
        if (!ageNum) return false;
        if (ageFilter === "0-5") return ageNum <= 5;
        if (ageFilter === "6-12") return ageNum >= 6 && ageNum <= 12;
        if (ageFilter === "13-18") return ageNum >= 13 && ageNum <= 18;
        return true;
      });
    }

    if (dateFilter) {
      list = list.filter((n) =>
        (n.monitoring_date || "").startsWith(dateFilter),
      );
    }

    return list;
  }, [nutrition, search, statusFilter, barangayFilter, ageFilter, dateFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Nutrition Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Track malnutrition and growth monitoring records for children in your barangay.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-primary" /> Record Nutrition Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Child Name</Label>
              <Input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label className="text-xs">Age</Label>
              <Input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 4"
              />
            </div>
            <div>
              <Label className="text-xs">Barangay</Label>
              <Select value={barangay} onValueChange={setBarangay}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QC_BARANGAYS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Height (cm)</Label>
              <Input
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 95"
              />
            </div>
            <div>
              <Label className="text-xs">Weight (kg)</Label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 14.2"
              />
            </div>
            <div>
              <Label className="text-xs">Nutritional Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Normal", "Underweight", "Severely Underweight", "Overweight", "Obese"].map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Monitoring Date</Label>
              <Input
                type="date"
                value={monitoringDate}
                onChange={(e) => setMonitoringDate(e.target.value)}
              />
            </div>
          </div>
          <Button
            size="sm"
            className="mt-1"
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !childName}
          >
            Save Nutrition Record
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-primary" /> Nutrition Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search by child name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 max-w-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Underweight">Underweight</SelectItem>
                <SelectItem value="Severely Underweight">
                  Severely Underweight
                </SelectItem>
                <SelectItem value="Overweight">Overweight</SelectItem>
                <SelectItem value="Obese">Obese</SelectItem>
              </SelectContent>
            </Select>
            <Select value={barangayFilter} onValueChange={setBarangayFilter}>
              <SelectTrigger className="h-8 w-[150px]">
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
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="Age group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ages</SelectItem>
                <SelectItem value="0-5">0–5</SelectItem>
                <SelectItem value="6-12">6–12</SelectItem>
                <SelectItem value="13-18">13–18</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-8 w-[150px]"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No nutrition records.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Child</TableHead>
                  <TableHead className="text-xs">Age</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">
                    Barangay
                  </TableHead>
                  <TableHead className="text-xs">Weight (kg)</TableHead>
                  <TableHead className="text-xs">Height (cm)</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((n: any) => (
                  <TableRow key={n.id}>
                    <TableCell className="text-sm">{n.child_name}</TableCell>
                    <TableCell className="text-sm">{n.age || "—"}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">
                      {n.barangay || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {n.weight_kg ?? n.weight ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {n.height_cm ?? n.height ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={n.nutritional_status || n.status} />
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell">
                      {n.monitoring_date || n.created_at}
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

export default BhwNutritionMonitoring;

