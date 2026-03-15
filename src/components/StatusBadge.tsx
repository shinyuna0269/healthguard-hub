import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  // Core workflow statuses with explicit colors (light + dark)
  submitted: {
    variant: "secondary",
    className:
      "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-100 dark:border-blue-500/40",
  },
  "under review": {
    variant: "secondary",
    className:
      "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-500/40",
  },
  "inspection scheduled": {
    variant: "secondary",
    className:
      "bg-violet-100 text-violet-800 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-100 dark:border-violet-500/40",
  },
  "inspection completed": {
    variant: "secondary",
    className:
      "bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-500/20 dark:text-teal-100 dark:border-teal-500/40",
  },
  "correction required": {
    variant: "secondary",
    className:
      "bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-100 dark:border-orange-500/40",
  },
  "re-inspection scheduled": {
    variant: "secondary",
    className:
      "bg-pink-100 text-pink-800 border border-pink-200 dark:bg-pink-500/20 dark:text-pink-100 dark:border-pink-500/40",
  },
  approved: {
    variant: "default",
    className:
      "bg-emerald-500 text-emerald-50 border border-emerald-600 dark:bg-emerald-400 dark:text-slate-950 dark:border-emerald-500",
  },
  "certificate issued": {
    variant: "default",
    className:
      "bg-green-700 text-emerald-50 border border-green-800 dark:bg-green-500 dark:text-slate-950 dark:border-green-600",
  },
  completed: {
    variant: "default",
    className:
      "bg-emerald-600 text-white border border-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-600",
  },
  missed: {
    variant: "destructive",
    className:
      "bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/20 dark:text-red-100 dark:border-red-500/40",
  },

  // Existing generic statuses mapped to the closest equivalents
  active: {
    variant: "default",
    className:
      "bg-emerald-500 text-emerald-50 border border-emerald-600 dark:bg-emerald-400 dark:text-slate-950 dark:border-emerald-500",
  },
  compliant: {
    variant: "default",
    className:
      "bg-emerald-500 text-emerald-50 border border-emerald-600 dark:bg-emerald-400 dark:text-slate-950 dark:border-emerald-500",
  },
  pending: {
    variant: "secondary",
    className:
      "bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-100 dark:border-orange-500/40",
  },
  "in-progress": {
    variant: "secondary",
    className:
      "bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-100 dark:border-sky-500/40",
  },
  scheduled: {
    variant: "secondary",
    className:
      "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-100 dark:border-blue-500/40",
  },
  rejected: {
    variant: "destructive",
    className:
      "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-500/40",
  },
  "non-compliant": {
    variant: "destructive",
    className:
      "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-500/40",
  },
  critical: {
    variant: "destructive",
    className:
      "bg-red-600 text-red-50 border border-red-700 dark:bg-red-500 dark:text-slate-950 dark:border-red-600",
  },
  resolved: {
    variant: "outline",
    className:
      "bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700/40 dark:text-gray-100 dark:border-gray-500/60",
  },

  // Disease report verification workflow
  "under bhw review": {
    variant: "secondary",
    className:
      "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-500/40",
  },
  "under medical verification": {
    variant: "secondary",
    className:
      "bg-violet-100 text-violet-800 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-100 dark:border-violet-500/40",
  },
  "verified case": {
    variant: "default",
    className:
      "bg-emerald-500 text-emerald-50 border border-emerald-600 dark:bg-emerald-400 dark:text-slate-950 dark:border-emerald-500",
  },
  closed: {
    variant: "outline",
    className:
      "bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700/40 dark:text-gray-100 dark:border-gray-500/60",
  },

  // Sanitary permit & establishment workflow
  "pending verification": {
    variant: "secondary",
    className:
      "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-500/40",
  },
  registered: {
    variant: "default",
    className:
      "bg-emerald-500 text-emerald-50 border border-emerald-600 dark:bg-emerald-400 dark:text-slate-950 dark:border-emerald-500",
  },
  "application submitted": {
    variant: "secondary",
    className:
      "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-100 dark:border-blue-500/40",
  },
  "payment confirmed": {
    variant: "secondary",
    className:
      "bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-500/20 dark:text-teal-100 dark:border-teal-500/40",
  },
  "reinspection requested": {
    variant: "secondary",
    className:
      "bg-pink-100 text-pink-800 border border-pink-200 dark:bg-pink-500/20 dark:text-pink-100 dark:border-pink-500/40",
  },
  "permit approved": {
    variant: "default",
    className:
      "bg-emerald-600 text-white border border-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-600",
  },
  "permit issued": {
    variant: "default",
    className:
      "bg-green-700 text-emerald-50 border border-green-800 dark:bg-green-500 dark:text-slate-950 dark:border-green-600",
  },
  "provisional permit issued": {
    variant: "secondary",
    className:
      "bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-100 dark:border-sky-500/40",
  },
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
