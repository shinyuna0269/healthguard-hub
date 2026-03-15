import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { FileText, ExternalLink } from "lucide-react";

export interface DetailField {
  label: string;
  value: string | number | null | undefined;
  isStatus?: boolean;
}

export interface AttachmentItem {
  label: string;
  url: string;
}

interface RecordDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: DetailField[];
  /** Optional: attached documents (e.g. lab results, referrals) */
  attachments?: AttachmentItem[] | null;
  /** Optional: referral destination (for referral records) */
  referralDestination?: string | null;
}

const RecordDetailModal = ({ open, onOpenChange, title, fields, attachments, referralDestination }: RecordDetailModalProps) => {
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  const hasReferral = referralDestination != null && String(referralDestination).trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

          {hasReferral && (
            <div className="flex flex-col gap-0.5 pt-1 border-t border-border">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Referral destination
              </span>
              <span className="text-sm text-foreground flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {referralDestination}
              </span>
            </div>
          )}

          {hasAttachments && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-border">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Attached documents
              </span>
              <ul className="space-y-1">
                {attachments!.map((a, i) => (
                  <li key={i}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      {a.label || "Document"}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordDetailModal;
