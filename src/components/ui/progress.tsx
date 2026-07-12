import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

/**
 * 进度条(设计系统 §8.5):填充带 primary 微光。
 * value 为 null/undefined 时呈现"不确定进度"扫动动画。
 */
function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const indeterminate = value == null;
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
      value={indeterminate ? undefined : value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "absolute h-full rounded-full bg-primary shadow-[0_0_12px_var(--primary-glow)] transition-transform",
          indeterminate ? "progress-indeterminate" : "left-0 w-full",
        )}
        style={indeterminate ? undefined : { transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
