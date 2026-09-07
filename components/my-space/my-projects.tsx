import type { MyWorkProject } from "@/lib/my-work-data";
import { ProjectStatusBadge } from "@/components/projects/status-badge";
import { EmptyState } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";

/**
 * "My Work"'s current-projects list (PRD.md section 6.9). Plain text, not
 * links — `/projects/[id]` is gated to delivery roles and would redirect an
 * Employee away (Phases.md Phase 10 decision).
 */
export function MyProjectList({ projects }: { projects: MyWorkProject[] }) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No current projects"
        description="Projects your company adds you to will show up here while they're in flight."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id}>
          <CardContent className="flex flex-col gap-2 py-2">
            <p className="text-brand-brown font-medium">{project.name}</p>
            <p className="text-text-secondary text-meta">
              {project.client.name}
            </p>
            <ProjectStatusBadge status={project.status} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
