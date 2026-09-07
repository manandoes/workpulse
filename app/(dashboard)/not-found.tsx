import Link from "next/link";
import { EmptyState } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

/**
 * Styled 404 for a missing record inside the dashboard shell (sidebar/nav
 * stay, since this renders within the (dashboard) layout) — what every
 * `notFound()` call scoped under a delivery/HR page (employee, project,
 * task, request, performance profile) now shows instead of Next's default.
 */
export default function DashboardNotFound() {
  return (
    <EmptyState
      title="Not found"
      description="That record doesn't exist, or you don't have access to it."
      action={
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
