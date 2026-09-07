import { cn } from "cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-surface-muted animate-pulse rounded-lg", className)}
      {...props}
    />
  );
}

export { Skeleton };
