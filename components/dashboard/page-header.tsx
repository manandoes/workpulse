export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  /** Rich enough to carry a link, e.g. a project's client. */
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 text-brand-brown font-semibold">{title}</h1>
        {description ? (
          <p className="text-text-secondary max-w-2xl">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/**
 * Empty state (Design.md section 11): short friendly message plus a clear
 * primary action, rather than a blank panel.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
      <h2 className="text-h3 text-brand-brown font-semibold">{title}</h2>
      <p className="text-text-secondary max-w-md">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/**
 * Placeholder for sections whose real content arrives in a later phase, so the
 * shell is navigable without pretending the feature exists.
 */
export function ComingInPhase({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="border-border bg-surface-muted text-text-secondary rounded-xl border px-5 py-4">
        This section is not built yet — it arrives in {phase}.
      </div>
    </>
  );
}
