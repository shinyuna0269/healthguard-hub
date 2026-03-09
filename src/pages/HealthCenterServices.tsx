import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { useRole } from "@/contexts/RoleContext";
import { Plus, Search, Eye } from "lucide-react";

const mockPatients = [
  { id: 1, name: "Maria Santos", age: 34, address: "Purok 2, Brgy. San Jose", date: "2026-03-08", symptoms: "Fever, Headache", diagnosis: "Dengue Fever", medicine: "Paracetamol", status: "active" },
  { id: 2, name: "Juan Dela Cruz", age: 55, address: "Purok 5, Brgy. Poblacion", date: "2026-03-07", symptoms: "Cough, Weight loss", diagnosis: "PTB Suspect", medicine: "Referral", status: "pending" },
  { id: 3, name: "Ana Reyes", age: 8, address: "Purok 1, Brgy. Mabini", date: "2026-03-06", symptoms: "Rashes, Itching", diagnosis: "Skin Allergy", medicine: "Cetirizine", status: "completed" },
  { id: 4, name: "Pedro Lim", age: 42, address: "Purok 3, Brgy. Rizal", date: "2026-03-05", symptoms: "Hypertension", diagnosis: "HPN Stage 2", medicine: "Amlodipine", status: "active" },
  { id: 5, name: "Rosa Garcia", age: 28, address: "Purok 4, Brgy. San Jose", date: "2026-03-04", symptoms: "Prenatal Checkup", diagnosis: "Normal Pregnancy", medicine: "Ferrous Sulfate", status: "completed" },
];

const HealthCenterServices = () => {
  const { currentRole } = useRole();
  const [search, setSearch] = useState("");
  const isCaptain = currentRole === "Captain_User";

  const filtered = mockPatients.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Health Center Services</h1>
          <p className="text-sm text-muted-foreground">
            {isCaptain ? "Summary statistics and reports" : "Patient records and consultations"}
          </p>
        </div>
        {!isCaptain && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Add Consultation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">New Consultation</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Patient Name</Label><Input placeholder="Full name" /></div>
                  <div><Label className="text-xs">Age</Label><Input type="number" placeholder="Age" /></div>
                </div>
                <div><Label className="text-xs">Address</Label><Input placeholder="Address" /></div>
                <div><Label className="text-xs">Symptoms</Label><Textarea placeholder="Describe symptoms..." rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Diagnosis</Label><Input placeholder="Diagnosis" /></div>
                  <div><Label className="text-xs">Medicine Given</Label><Input placeholder="Medicine" /></div>
                </div>
                <div><Label className="text-xs">Notes</Label><Textarea placeholder="Additional notes..." rows={2} /></div>
                <Button className="w-full">Save Consultation</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients or diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Patient</TableHead>
                <TableHead className="text-xs">Age</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                {!isCaptain && <TableHead className="text-xs hidden lg:table-cell">Symptoms</TableHead>}
                <TableHead className="text-xs">Diagnosis</TableHead>
                {!isCaptain && <TableHead className="text-xs hidden md:table-cell">Medicine</TableHead>}
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{isCaptain ? "****" : p.name}</TableCell>
                  <TableCell className="text-sm">{p.age}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{p.date}</TableCell>
                  {!isCaptain && <TableCell className="text-sm hidden lg:table-cell">{p.symptoms}</TableCell>}
                  <TableCell className="text-sm">{p.diagnosis}</TableCell>
                  {!isCaptain && <TableCell className="text-sm hidden md:table-cell">{p.medicine}</TableCell>}
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell>
                    {!isCaptain && (
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthCenterServices;
