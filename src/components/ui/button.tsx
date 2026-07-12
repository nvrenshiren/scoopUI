import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-100 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] active:brightness-90 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_0_12px_var(--primary-glow)] hover:bg-primary-hover hover:shadow-[0_0_20px_var(--primary-glow),0_0_40px_var(--primary-glow)]",
        secondary: "bg-secondary text-secondary-foreground border border-border hover:border-border-strong",
        outline: "border border-border bg-transparent hover:bg-secondary",
        ghost: "hover:bg-secondary",
        destructive: "bg-destructive text-white hover:shadow-[0_0_16px_var(--destructive-glow)]",
        /* 取消 ≠ 失败:中性灰(设计系统 §9 硬约束) */
        cancel:
          "bg-secondary border border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-12 px-6 rounded-lg text-[15px]",
        icon: "size-10",
        iconSm: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
