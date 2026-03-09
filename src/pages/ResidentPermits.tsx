import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";

const mockPermits = [
  { business: "My Sari-Sari Store", type: "Retail", applied: "2026-02-10", status: "approved" },
  { business: "My Carinderia", type: "Food", applied: "2026-03-01", status: "pending" },
];

const ResidentPermits = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold font-heading">My Business Permits</h1>
      <p className="text-sm text-muted-foreground">Track your sanitation permit applications</p>
    </div>
    <Card className="glass-card">
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Business</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Applied</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPermits.map((p, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium text-sm">{p.business}</TableCell>
                <TableCell className="text-sm">{p.type}</TableCell>
                <TableCell className="text-sm">{p.applied}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

export default ResidentPermits;
