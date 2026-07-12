import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-5 items-center gap-1 rounded-sm border px-2 text-xs font-medium whitespace-nowrap [&_svg]:size-[11px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-muted-foreground",
        success: "border-[var(--primary-glow)] bg-[var(--primary-glow-soft)] text-primary",
        warning: "border-warning/30 bg-[var(--warning-15)] text-warning",
        destructive: "border-destructive/30 bg-[var(--destructive-glow)] text-destructive",
        info: "border-info/30 bg-info/10 text-info",
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
