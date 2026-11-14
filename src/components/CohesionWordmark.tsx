import { cn } from "@/lib/utils";

export function CohesionWordmark({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="COHESION 逐科" className={cn("relative block h-8 w-24 shrink-0 overflow-hidden", className)}>
      <img
        src="/branding/cohesion-color.png"
        alt=""
        aria-hidden="true"
        className="cohesion-logo cohesion-logo-color absolute -top-[28px] left-0 h-24 w-24 max-w-none"
      />
      <img
        src="/branding/cohesion-white.png"
        alt=""
        aria-hidden="true"
        className="cohesion-logo cohesion-logo-white absolute -top-[28px] left-0 h-24 w-24 max-w-none"
      />
    </span>
  );
}
