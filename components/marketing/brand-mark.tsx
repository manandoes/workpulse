import { cn } from "cn";

/**
 * AgencyOS wordmark. Flat brand-yellow tile with the brand-brown initial,
 * per Design.md section 1 (no gradients, no decorative effects).
 */
export function BrandMark({
  className,
  labelClassName,
}: {
  className?: string;
  labelClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="bg-brand-yellow text-brand-brown flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
      >
        A
      </span>
      <span
        className={cn(
          "text-brand-brown text-h3 font-semibold tracking-tight",
          labelClassName
        )}
      >
        AgencyOS
      </span>
    </span>
  );
}
