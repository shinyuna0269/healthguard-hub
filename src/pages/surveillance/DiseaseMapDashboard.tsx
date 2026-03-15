import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Map as MapIcon, Filter, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import qcBoundaryData from "@/data/quezon-city-boundary.json";

// Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Status-based colors ONLY: active=red, resolved=green
const getMarkerColor = (status: string) => {
  const s = status.toLowerCase();
  if (s === "resolved" || s === "completed") return "#22c55e";
  return "#ef4444"; // active, pending, etc. → red
};

const createIcon = (color: string) =>
  L.divIcon({
    className: "custom-disease-marker",
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

// Verified cases from disease_cases have lat/long; fallback for legacy or display
const BARANGAY_COORDS: Record<string, [number, number]> = {
  "Commonwealth": [14.6994, 121.0867],
  "Batasan Hills": [14.6819, 121.0968],
  "Holy Spirit": [14.6809, 121.0804],
  "Payatas": [14.7095, 121.1022],
  "Bagong Silangan": [14.6887, 121.1109],
  "Fairview": [14.7131, 121.0690],
  "Novaliches": [14.7283, 121.0439],
  "Tandang Sora": [14.6849, 121.0436],
  "Diliman": [14.6538, 121.0586],
  "Cubao": [14.6180, 121.0579],
  "Kamuning": [14.6316, 121.0437],
  "Project 6": [14.6512, 121.0396],
};

interface DiseaseCase {
  case_id?: string;
  id?: string;
  disease_type?: string;
  disease?: string;
  barangay?: string | null;
  patient_location?: string | null;
  latitude?: number;
  longitude?: number;
  date_reported?: string;
  case_date?: string;
  status: string;
  case_count?: number;
}

// Extract QC polygon coordinates from GeoJSON
const getQCPolygonCoords = (): L.LatLngExpression[][] => {
  const feature = (qcBoundaryData as any).features?.[0];
  if (!feature?.geometry?.coordinates) return [];
  const coords = feature.geometry.coordinates;
  // Handle both Polygon and MultiPolygon
  if (feature.geometry.type === "Polygon") {
    return coords.map((ring: number[][]) =>
      ring.map((c: number[]) => [c[1], c[0]] as L.LatLngExpression)
    );
  }
  if (feature.geometry.type === "MultiPolygon") {
    return coords.flat().map((ring: number[][]) =>
      ring.map((c: number[]) => [c[1], c[0]] as L.LatLngExpression)
    );
  }
  return [];
};

const DiseaseMapDashboard = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterDisease, setFilterDisease] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: cases = [] } = useQuery({
    queryKey: ["disease_map_cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disease_cases")
        .select("*")
        .order("date_reported", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as DiseaseCase[];
    },
    refetchInterval: 15000,
  });

  const diseaseName = (c: DiseaseCase) => c.disease_type ?? c.disease ?? "";
  const locationName = (c: DiseaseCase) => c.barangay ?? c.patient_location ?? "";
  const caseDate = (c: DiseaseCase) => c.date_reported ?? c.case_date ?? "";

  const diseases = useMemo(() => [...new Set(cases.map(diseaseName).filter(Boolean))], [cases]);
  const barangays = useMemo(() => [...new Set(cases.map(locationName).filter(Boolean))], [cases]);
  const statuses = useMemo(() => [...new Set(cases.map((c) => c.status))], [cases]);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (filterBarangay && locationName(c) !== filterBarangay) return false;
      if (filterDisease && diseaseName(c) !== filterDisease) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      const d = caseDate(c);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [cases, filterBarangay, filterDisease, filterStatus, dateFrom, dateTo]);

  // Summary stats (verified cases on map)
  const { totalCases, activeCases } = useMemo(() => {
    const total = cases.length;
    const activeCount = cases.filter((c) => !["resolved", "completed"].includes((c.status || "").toLowerCase())).length;
    return { totalCases: total, activeCases: activeCount };
  }, [cases]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      minZoom: 11,
      maxZoom: 18,
    }).setView([14.676, 121.0437], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Build world mask minus QC boundary (world polygon with QC as hole)
    const qcRings = getQCPolygonCoords();
    if (qcRings.length > 0) {
      // World outer ring (must be counterclockwise for Leaflet hole logic)
      const worldOuter: L.LatLngExpression[] = [
        [-90, -180],
        [-90, 180],
        [90, 180],
        [90, -180],
      ];

      // The QC boundary ring is the "hole" in the world polygon
      // Leaflet polygon: first ring = outer, subsequent rings = holes
      const maskRings: L.LatLngExpression[][] = [worldOuter, ...qcRings];

      L.polygon(maskRings, {
        color: "transparent",
        fillColor: "#94a3b8",
        fillOpacity: 0.6,
        interactive: false,
      }).addTo(map);

      // Draw QC boundary outline
      qcRings.forEach((ring) => {
        L.polyline(ring, {
          color: "#22c55e",
          weight: 2.5,
          opacity: 0.8,
        }).addTo(map);
      });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = (L as any).markerClusterGroup({
      iconCreateFunction: (clusterObj: any) => {
        const count = clusterObj.getChildCount();
        return L.divIcon({
          html: `<div style="background:#ef4444;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)">${count}</div>`,
          className: "custom-cluster-icon",
          iconSize: L.point(36, 36),
        });
      },
    });
    clusterRef.current = cluster;

    filtered.forEach((c) => {
      const lat = c.latitude;
      const lng = c.longitude;
      const coords: [number, number] | undefined =
        lat != null && lng != null ? [lat, lng] : BARANGAY_COORDS[locationName(c)];
      if (!coords) return;

      const color = getMarkerColor(c.status);
      const marker = L.marker([coords[0], coords[1]], { icon: createIcon(color) });
      marker.bindPopup(
        `<div style="font-size:13px;line-height:1.5">
          <strong>${diseaseName(c)}</strong><br/>
          <b>Barangay:</b> ${locationName(c)}<br/>
          <b>Status:</b> <span style="color:${color};font-weight:600">${c.status}</span><br/>
          <b>Date:</b> ${caseDate(c)}
        </div>`,
      );
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
  }, [filtered]);

  const clearFilters = () => {
    setFilterBarangay("");
    setFilterDisease("");
    setFilterStatus("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
          <MapIcon className="h-6 w-6 text-primary" /> Disease Surveillance Mapping
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time disease case mapping — Quezon City
        </p>
      </div>

      {/* Map */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div ref={mapRef} className="w-full h-[520px] rounded-lg" />
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="glass-card border border-primary/10">
          <CardContent className="py-3 px-3">
            <p className="text-[11px] text-muted-foreground mb-1">Total Cases</p>
            <p className="text-xl font-semibold font-heading">{totalCases}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border border-rose-400/20">
          <CardContent className="py-3 px-3">
            <p className="text-[11px] text-muted-foreground mb-1">Active Cases</p>
            <p className="text-xl font-semibold font-heading text-rose-600">{activeCases}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border border-emerald-400/20">
          <CardContent className="py-3 px-3">
            <p className="text-[11px] text-muted-foreground mb-1">Resolved</p>
            <p className="text-xl font-semibold font-heading text-emerald-600">{cases.length - activeCases}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters + case list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Barangay</Label>
              <select className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs" value={filterBarangay} onChange={(e) => setFilterBarangay(e.target.value)}>
                <option value="">All Barangays</option>
                {barangays.map((b) => <option key={b} value={b!}>{b}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Disease Type</Label>
              <select className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs" value={filterDisease} onChange={(e) => setFilterDisease(e.target.value)}>
                <option value="">All Diseases</option>
                {diseases.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <select className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Date From</Label>
              <Input type="date" className="h-8 text-xs" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Date To</Label>
              <Input type="date" className="h-8 text-xs" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={clearFilters}>Clear Filters</Button>

            {/* Legend */}
            <div className="pt-2 border-t border-border">
              <p className="text-[11px] font-semibold text-muted-foreground mb-2">Map Legend</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm" />
                  Active Case
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm" />
                  Resolved Case
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm text-[9px] flex items-center justify-center font-bold text-white" style={{ width: 18, height: 18 }}>5</span>
                  Cluster (always red)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case list */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading">Cases on Map ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No cases match current filters.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                {filtered.map((c) => {
                  const color = getMarkerColor(c.status);
                  return (
                    <div key={c.id} className="p-2 rounded-lg border border-border bg-muted/20 flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{diseaseName(c)}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {locationName(c) || "Unknown"} · {caseDate(c)} · {c.status}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {c.case_count} case{c.case_count === 1 ? "" : "s"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiseaseMapDashboard;
