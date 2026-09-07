"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormError, FormField, TextareaField } from "@/components/forms/fields";
import {
  createClientSchema,
  type CreateClientInput,
} from "@/lib/validations/projects";

/**
 * Add and edit a client (Phases.md Phase 4).
 *
 * One component covers both, because the fields and the validation rules are
 * the same — only the endpoint differs. Archiving is deliberately not here: it
 * is its own action, so it can never happen as a side effect of saving.
 */
export function ClientForm({
  mode,
  clientId,
  defaultValues,
  cancelHref,
}: {
  mode: "create" | "edit";
  clientId?: string;
  defaultValues: CreateClientInput;
  cancelHref: string;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const response = await fetch(
      mode === "create" ? "/api/clients" : `/api/clients/${clientId}`,
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
          setError(field as keyof CreateClientInput, { message });
        }
      }
      setFormError(body?.error ?? "Could not save this client.");
      return;
    }

    toast.success(
      mode === "create" ? `${body.client.name} added` : "Client updated"
    );
    router.push(`/projects/clients/${clientId ?? body.client.id}`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <FormError message={formError} />

      <fieldset className="flex flex-col gap-4">
        <legend className="sr-only">Client details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="name"
            label="Client name"
            placeholder="Northwind Retail"
            fieldClassName="sm:col-span-2"
            error={errors.name?.message}
            {...register("name")}
          />
          <FormField
            id="contactName"
            label="Main contact"
            placeholder="Priya Sharma"
            error={errors.contactName?.message}
            {...register("contactName")}
          />
          <FormField
            id="contactEmail"
            label="Contact email"
            type="email"
            placeholder="priya@northwind.com"
            error={errors.contactEmail?.message}
            {...register("contactEmail")}
          />
          <FormField
            id="contactPhone"
            label="Contact phone"
            type="tel"
            error={errors.contactPhone?.message}
            {...register("contactPhone")}
          />
          <TextareaField
            id="notes"
            label="Notes"
            hint="Anything the team should know about working with them."
            fieldClassName="sm:col-span-2"
            error={errors.notes?.message}
            {...register("notes")}
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "create"
              ? "Add client"
              : "Save changes"}
        </Button>
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
