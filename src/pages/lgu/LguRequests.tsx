import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";

const LguRequests = () => {
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterServiceType, setFilterServiceType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ["lgu_requests_table"],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (err) throw err;
      return data;
    },
    refetchInterval: 30000,
  });

  const serviceTypes = useMemo(
    () => [...new Set(requests.map((r) => r.request_type).filter(Boolean))].sort(),
    [requests],
  );
  const statuses = useMemo(
    () => [...new Set(requests.map((r) => r.status).filter(Boolean))].sort(),
    [requests],
  );

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filterBarangay.trim()) {
        const bar = filterBarangay.trim().toLowerCase();
        const desc = (r.description || "").toLowerCase();
        const title = (r.title || "").toLowerCase();
        if (!desc.includes(bar) && !title.includes(bar)) return false;
      }
      if (filterServiceType && r.request_type !== filterServiceType) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (dateFrom) {
        const d = (r.created_at || "").split("T")[0];
        if (d < dateFrom) return false;
      }
      if (dateTo) {
        const d = (r.created_at || "").split("T")[0];
        if (d > dateTo) return false;
      }
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        if (
          !(r.request_type || "").toLowerCase().includes(q) &&
          !(r.title || "").toLowerCase().includes(q) &&
          !(r.description || "").toLowerCase().includes(q) &&
          !(r.id || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [requests, filterBarangay, filterServiceType, filterStatus, dateFrom, dateTo, searchText]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Real-Time Service Requests</h1>
        <p className="text-sm text-muted-foreground">
          Municipal-wide monitoring — same data as BHW and Health Center Staff assisted requests
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" /> Filters
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Input
              placeholder="Barangay (search in description)"
              value={filterBarangay}
              onChange={(e) => setFilterBarangay(e.target.value)}
              className="h-8 w-44"
            />
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm w-40"
              value={filterServiceType}
              onChange={(e) => setFilterServiceType(e.target.value)}
            >
              <option value="">All service types</option>
              {serviceTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm w-36"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Input
              type="date"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 w-36"
            />
            <Input
              type="date"
              placeholder="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 w-36"
            />
            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search type, title, description..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading requests...</p>
          ) : error ? (
            <p className="text-sm text-destructive py-6 text-center">Failed to load requests. Please try again.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Updated</TableHead>
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
                    <TableCell className="text-sm hidden lg:table-cell">
                      {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "—"}
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

export default LguRequests;
