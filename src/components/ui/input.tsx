import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground transition-[border-color,box-shadow] outline-none",
        "placeholder:text-subtle selection:bg-primary/25",
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
