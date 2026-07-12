import * as React from "react";

import { cn } from "@/lib/utils";

/* 表格容器:仅纵向滚动,列超宽以 ellipsis 截断,不出现横向滚动条(用户要求) */
function TableWrap({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-card",
        className,
      )}
      {...props}
    />
  );
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return <table className={cn("w-full border-collapse text-[13px]", className)} {...props} />;
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("", className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b border-border transition-colors last:border-b-0 hover:bg-secondary", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "sticky top-0 z-[1] h-10 bg-card px-3 text-left font-medium whitespace-nowrap text-muted-foreground",
        "border-b border-border",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("h-10 max-w-[360px] overflow-hidden px-3 text-ellipsis whitespace-nowrap", className)}
      {...props}
    />
  );
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap };
