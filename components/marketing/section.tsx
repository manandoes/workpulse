import { cn } from "cn";

/**
 * Full-width marketing section with a centered 1200px content container
 * (Design.md section 5).
 */
export function Section({
  id,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("w-full px-6 py-16 sm:py-20", className)}>
      <div className={cn("mx-auto w-full max-w-[1200px]", containerClassName)}>
        {children}
      </div>
    </section>
  );
}

/**
 * Eyebrow + title + optional description, used at the top of each section.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start"
      )}
    >
      {eyebrow ? (
        <p className="text-meta text-brand-brown-soft font-medium tracking-wide uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-h2 text-brand-brown font-semibold">{title}</h2>
      {description ? (
        <p
          className={cn(
            "text-text-secondary max-w-2xl",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
