import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth";
import { loadAssigneesByProject, loadTaskProjects } from "@/lib/task-data";
import { canViewTasks } from "@/lib/permissions";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "New task — AgencyOS" };

/**
 * Raise a task (Phases.md Phase 5).
 *
 * Whether the caller may actually file it under the project they choose is
 * settled by the API against that project's lead — this page only keeps a role
 * that has no business here out of the form (Rules.md section 3).
 */
export default async function NewTaskPage({
  searchParams,
}: PageProps<"/tasks/new">) {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (!canViewTasks(actor)) redirect("/dashboard");

  const { projectId } = await searchParams;

  const [projects, assigneesByProject] = await Promise.all([
    // Completed and cancelled projects are not offered: new work almost never
    // belongs on one, and an existing task on one is still editable.
    loadTaskProjects(actor, { openOnly: true }),
    loadAssigneesByProject(actor),
  ]);

  if (projects.length === 0) {
    return (
      <>
        <PageHeader
          title="New task"
          description="Every task belongs to a project."
        />
        <EmptyState
          title="Create a project first"
          description="A task is always work on a project, so start one and then break it into tasks."
          action={
            <Button asChild>
              <Link href="/projects/new">Create a project</Link>
            </Button>
          }
        />
      </>
    );
  }

  /** Arriving from a project page pre-selects that project. */
  const preselected =
    typeof projectId === "string" &&
    projects.some((project) => project.value === projectId)
      ? projectId
      : projects.length === 1
        ? projects[0].value
        : "";

  return (
    <>
      <PageHeader
        title="New task"
        description="Comments and attachments can be added once the task exists."
      />

      <Card>
        <CardContent className="py-2">
          <TaskForm
            mode="create"
            cancelHref="/tasks"
            projects={projects}
            assigneesByProject={assigneesByProject}
            defaultValues={{
              title: "",
              projectId: preselected,
              description: "",
              status: "Todo",
              priority: "Medium",
              assigneeId: "",
              dueDate: "",
              estimatedHours: "",
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
