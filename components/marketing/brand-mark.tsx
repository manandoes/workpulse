import { cn } from "cn";

/**
 * The WorkPulse pulse-wave mark: a heartbeat line tracing a "W", blue to
 * green. Used standalone (app/icon.svg) and inline here next to the
 * wordmark.
 */
function PulseMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 190 100"
      aria-hidden
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="wp-pulse" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2E9BE0" />
          <stop offset="50%" stopColor="#249B7C" />
          <stop offset="100%" stopColor="#2FAE4E" />
        </linearGradient>
      </defs>
      <path
        d="M18 58 H30 L38 18 L58 88 L78 10 L98 88 L118 30 L126 15 L132 40 L150 15 L166 58 H178"
        fill="none"
        stroke="url(#wp-pulse)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="58" r="7" fill="#2E9BE0" />
      <circle cx="184" cy="58" r="7" fill="#2FAE4E" />
    </svg>
  );
}

/**
 * WorkPulse wordmark: the pulse mark beside the brand-brown name.
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
      <PulseMark className="h-6 w-auto shrink-0" />
      <span
        className={cn(
          "text-brand-brown text-h3 font-semibold tracking-tight",
          labelClassName
        )}
      >
        WorkPulse
      </span>
    </span>
  );
}
