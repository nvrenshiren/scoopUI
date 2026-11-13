import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-5 items-center gap-1 rounded-md border px-2 text-xs font-medium whitespace-nowrap [&_svg]:size-[11px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-muted-foreground",
        success: "border-success/25 bg-[var(--success-soft)] text-success",
        warning: "border-warning/25 bg-[var(--warning-soft)] text-warning",
        destructive: "border-destructive/25 bg-[var(--destructive-glow)] text-destructive",
        info: "border-info/25 bg-[var(--info-soft)] text-info",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
