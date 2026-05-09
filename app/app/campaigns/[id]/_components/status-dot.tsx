"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function StatusDot({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              role="status"
              aria-label={`Status: ${label}`}
              className={cn(
                "inline-block w-2.5 h-2.5 rounded-full shrink-0 cursor-default",
                className,
              )}
            />
          }
        />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
