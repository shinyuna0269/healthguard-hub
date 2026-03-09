import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  active: { variant: "default", className: "bg-success text-success-foreground" },
  approved: { variant: "default", className: "bg-success text-success-foreground" },
  completed: { variant: "default", className: "bg-success text-success-foreground" },
  compliant: { variant: "default", className: "bg-success text-success-foreground" },
  pending: { variant: "secondary", className: "bg-warning/15 text-warning border-warning/30" },
  "in-progress": { variant: "secondary", className: "bg-info/15 text-info border-info/30" },
  scheduled: { variant: "secondary", className: "bg-info/15 text-info border-info/30" },
  rejected: { variant: "destructive", className: "bg-destructive/15 text-destructive border-destructive/30" },
  "non-compliant": { variant: "destructive", className: "bg-destructive/15 text-destructive border-destructive/30" },
  critical: { variant: "destructive", className: "bg-destructive text-destructive-foreground" },
  resolved: { variant: "outline", className: "border-muted-foreground/30 text-muted-foreground" },
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusMap[status.toLowerCase()] || { variant: "outline" as const, className: "" };
  return (
    <Badge variant={config.variant} className={cn("text-[10px] font-medium", config.className, className)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;
