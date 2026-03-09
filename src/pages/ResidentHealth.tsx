import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";

const mockRecords = [
  { date: "2026-03-01", type: "Consultation", diagnosis: "Flu", medicine: "Paracetamol", doctor: "Dr. Santos" },
  { date: "2026-02-15", type: "Vaccination", diagnosis: "COVID Booster", medicine: "Pfizer", doctor: "BHW Cruz" },
  { date: "2026-01-20", type: "Checkup", diagnosis: "Normal", medicine: "—", doctor: "Dr. Reyes" },
];

const ResidentHealth = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold font-heading">My Family Health Records</h1>
      <p className="text-sm text-muted-foreground">View your personal and family health history</p>
    </div>
    <Card className="glass-card">
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Diagnosis</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Medicine</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Provider</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRecords.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm">{r.date}</TableCell>
                <TableCell className="text-sm">{r.type}</TableCell>
                <TableCell className="text-sm">{r.diagnosis}</TableCell>
                <TableCell className="text-sm hidden md:table-cell">{r.medicine}</TableCell>
                <TableCell className="text-sm hidden md:table-cell">{r.doctor}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

export default ResidentHealth;
