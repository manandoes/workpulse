import { cn } from "cn";

/**
 * A person's profile photo, or their initials if none is set. Shared by the
 * sidebar name block and the profile page so the fallback logic lives once.
 */
export function Avatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL, not a static asset next/image can optimise
      <img
        src={avatarUrl}
        alt=""
        aria-hidden
        className={cn("size-9 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      aria-hidden
      className={cn(
        "bg-brand-yellow-light text-brand-brown flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        className
      )}
    >
      {initials || "?"}
    </span>
  );
}
