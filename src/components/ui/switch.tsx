// 轻量拨动开关(项目未装 @radix-ui/react-switch;bool 配置项用它)。
// 尺寸和状态颜色沿用 COHESION shadcn Switch 规格;原生 button 提供 Space/Enter 键盘行为。
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  ariaLabelledBy,
  ariaDescribedBy,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-input shadow-xs transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked && "bg-primary",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-4 rounded-full bg-foreground shadow-xs transition-transform",
          checked && "translate-x-[calc(100%-2px)] bg-primary-foreground",
        )}
      />
    </button>
  );
}
