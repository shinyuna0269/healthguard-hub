import * as React from "react";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DateInputWithCalendarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
}

const DateInputWithCalendar = React.forwardRef<HTMLInputElement, DateInputWithCalendarProps>(
  ({ className, ...props }, ref) => (
    <div className={cn("relative flex items-center", className)}>
      <Calendar
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none shrink-0"
        aria-hidden
      />
      <Input
        type="date"
        ref={ref}
        className="pl-10 h-9 w-full"
        {...props}
      />
    </div>
  )
);
DateInputWithCalendar.displayName = "DateInputWithCalendar";

export { DateInputWithCalendar };
