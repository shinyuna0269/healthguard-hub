import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";

interface DetailField {
  label: string;
  value: string | number | null | undefined;
  isStatus?: boolean;
}

interface RecordDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: DetailField[];
}

const RecordDetailModal = ({ open, onOpenChange, title, fields }: RecordDetailModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-sm">{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {fields.map((field, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {field.label}
              </span>
              {field.isStatus ? (
                <StatusBadge status={String(field.value || "—")} />
              ) : (
                <span className="text-sm text-foreground">
                  {field.value != null && field.value !== "" ? String(field.value) : "—"}
                </span>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordDetailModal;
