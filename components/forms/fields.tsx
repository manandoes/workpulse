import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

/**
 * Shared form primitives.
 *
 * Every form in the product — auth, employees, and the phases still to come —
 * uses these so validation messages look and behave the same everywhere.
 *
 * Errors are wired with `aria-describedby` and `aria-invalid` so screen readers
 * announce them, rather than the message being visual-only (Design.md § 10).
 */

function FieldShell({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-brand-brown font-medium">
        {label}
      </Label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-text-secondary text-meta">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-danger-text text-meta">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Ids of the messages describing a field, for `aria-describedby`. */
function describedBy(id: string, error?: string, hint?: string) {
  return (
    [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

export function FormField({
  id,
  label,
  error,
  hint,
  className,
  fieldClassName,
  ...inputProps
}: React.ComponentProps<"input"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Applied to the wrapper, for grid spans. */
  fieldClassName?: string;
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn("h-9", className)}
        {...inputProps}
      />
    </FieldShell>
  );
}

export type SelectOption = { value: string; label: string };
export type SelectGroup = { label: string; options: SelectOption[] };

/**
 * A native `<select>` rather than the Radix one, so it works directly with
 * React Hook Form's `register()` and needs no extra client state. Styled to
 * match `Input` so the two line up in a grid.
 */
export function SelectField({
  id,
  label,
  error,
  hint,
  placeholder,
  options,
  groups,
  className,
  fieldClassName,
  ...selectProps
}: Omit<React.ComponentProps<"select">, "children"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Shown as the empty first option. */
  placeholder?: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  fieldClassName?: string;
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          "border-input bg-surface text-foreground h-9 w-full rounded-lg border px-3",
          "aria-[invalid=true]:border-danger",
          className
        )}
        {...selectProps}
      >
        {placeholder !== undefined ? (
          <option value="">{placeholder}</option>
        ) : null}
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {groups?.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </FieldShell>
  );
}

export function TextareaField({
  id,
  label,
  error,
  hint,
  className,
  fieldClassName,
  ...textareaProps
}: React.ComponentProps<"textarea"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          "border-input bg-surface text-foreground w-full rounded-lg border px-3 py-2",
          "aria-[invalid=true]:border-danger",
          className
        )}
        {...textareaProps}
      />
    </FieldShell>
  );
}

/**
 * Form-level error banner. Uses the danger token as a thin accent rather than a
 * saturated fill, in keeping with Design.md section 9.
 */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="border-danger bg-surface-muted text-brand-brown rounded-lg border-l-4 px-3 py-2"
    >
      {message}
    </p>
  );
}
