"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  FormError,
  FormField,
  SelectField,
  TextareaField,
  type SelectOption,
} from "@/components/forms/fields";
import { projectStatusLabel } from "@/components/projects/status-badge";
import { PROJECT_STATUSES } from "@/lib/projects";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validations/projects";

/**
 * Create and edit a project (Phases.md Phase 4).
 *
 * One component covers both, because the fields and the validation rules are
 * the same — only the endpoint differs. The team is managed on the project page
 * rather than here, so adding someone is one click and not a form save.
 */
const STATUS_OPTIONS = PROJECT_STATUSES.map((status) => ({
  value: status,
  label: projectStatusLabel(status),
}));

export function ProjectForm({
  mode,
  projectId,
  defaultValues,
  clients,
  leads,
  currency,
  cancelHref,
}: {
  mode: "create" | "edit";
  projectId?: string;
  defaultValues: CreateProjectInput;
  /** Clients to choose from — archived ones are excluded by the caller. */
  clients: SelectOption[];
  leads: SelectOption[];
  currency: string;
  cancelHref: string;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const response = await fetch(
      mode === "create" ? "/api/projects" : `/api/projects/${projectId}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    );

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      if (body?.fieldErrors) {
        for (const [field, message] of Object.entries(
          body.fieldErrors as Record<string, string>
        )) {
          setError(field as keyof CreateProjectInput, { message });
        }
      }
      setFormError(body?.error ?? "Could not save this project.");
      return;
    }

    if (mode === "edit" && body.stillManageable === false) {
      /**
       * They handed the lead to someone else, and a Manager only manages the
       * projects they lead — better to say so here than to let them discover
       * it through a refused save.
       */
      toast.warning(
        "Project updated. You are no longer its lead, so you can no longer edit it."
      );
      router.push("/projects");
      router.refresh();
      return;
    }

    toast.success(
      mode === "create" ? `${body.project.name} created` : "Project updated"
    );
    router.push(`/projects/${projectId ?? body.project.id}`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <FormError message={formError} />

      <Section title="Project" description="What the work is, and for whom.">
        <FormField
          id="name"
          label="Project name"
          placeholder="Website redesign"
          fieldClassName="sm:col-span-2"
          error={errors.name?.message}
          {...register("name")}
        />
        <SelectField
          id="clientId"
          label="Client"
          placeholder="Choose a client"
          options={clients}
          error={errors.clientId?.message}
          {...register("clientId")}
        />
        <FormField
          id="code"
          label="Project code"
          placeholder="NW-WEB"
          hint="Optional short reference, unique in your company."
          error={errors.code?.message}
          {...register("code")}
        />
        <TextareaField
          id="description"
          label="Description"
          fieldClassName="sm:col-span-2"
          error={errors.description?.message}
          {...register("description")}
        />
      </Section>

      <Section
        title="Schedule and ownership"
        description="Where it stands and who is accountable for it."
      >
        <SelectField
          id="status"
          label="Status"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          {...register("status")}
        />
        <SelectField
          id="lead"
          label="Project lead"
          placeholder="No lead"
          options={leads}
          hint={
            mode === "create"
              ? "Defaults to you. The lead can always edit this project."
              : "Managers can edit only the projects they lead."
          }
          error={errors.lead?.message}
          {...register("lead")}
        />
        <FormField
          id="startDate"
          label="Start date"
          type="date"
          error={errors.startDate?.message}
          {...register("startDate")}
        />
        <FormField
          id="dueDate"
          label="Due date"
          type="date"
          error={errors.dueDate?.message}
          {...register("dueDate")}
        />
      </Section>

      <Section
        title="Financials"
        description={`Amounts in ${currency}. Margin is worked out from these two numbers and never stored.`}
      >
        <FormField
          id="value"
          label="Project value"
          inputMode="decimal"
          placeholder="150000"
          hint="What the client is billed."
          error={errors.value?.message}
          {...register("value")}
        />
        <FormField
          id="estimatedCost"
          label="Estimated cost"
          inputMode="decimal"
          placeholder="90000"
          hint="What you expect it to cost to deliver."
          error={errors.estimatedCost?.message}
          {...register("estimatedCost")}
        />
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "create"
              ? "Create project"
              : "Save changes"}
        </Button>
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="sr-only">{title}</legend>
      <div className="flex flex-col gap-1">
        <h2 className="text-h3 text-brand-brown font-semibold">{title}</h2>
        <p className="text-text-secondary text-meta">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
