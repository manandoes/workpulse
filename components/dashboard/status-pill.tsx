import { cn } from "cn";

/**
 * The status pill every module marks state with — employees, clients,
 * projects, tasks (Design.md § 6).
 *
 * Three rules from Design.md are enforced here rather than left to each caller:
 *
 *  - status uses the *status* palette, never brand yellow/brown, so an accent
 *    can never be mistaken for an alert (§ 3);
 *  - colour is always paired with a text label, never used alone (§ 10);
 *  - the label text uses the darkened `*-text` tokens, which meet the AA
 *    contrast floor (§ 10) that the fill hues miss — the fill hue is kept for
 *    the dot, where contrast does not apply.
 *
 * Each module declares its own vocabulary of styles and keeps the markup here,
 * so a new status set cannot quietly arrive with a different shape or a colour
 * that fails contrast.
 */
export type PillStyle = {
  /** A `text-*-text` token from the status palette. */
  text: string;
  /** The matching `bg-*` fill, used only for the dot. */
  dot: string;
  label: string;
  /** Shown on hover — what the status actually means. */
  description: string;
};

export function StatusPill({
  style,
  icon,
  className,
}: {
  style: PillStyle;
  /** Replaces the dot where an icon carries the meaning better. */
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      title={style.description}
      className={cn(
        "bg-surface-muted text-meta inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
        style.text,
        className
      )}
    >
      {icon ?? (
        <span aria-hidden className={cn("size-1.5 rounded-full", style.dot)} />
      )}
      {style.label}
    </span>
  );
}
