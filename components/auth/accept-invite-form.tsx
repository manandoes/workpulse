"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/forms/fields";

/**
 * The "set your password" half of both invite flows (Architecture.md
 * section 8): prove you hold the one-time token, choose a password, then get
 * signed straight in.
 *
 * The two kinds post to different endpoints and sign in through different
 * providers — an employee is never authenticated against the CompanyAccount
 * table, or the other way round. Only the password is user-supplied here; the
 * token comes from the URL.
 */
const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(200),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SetPasswordInput = z.infer<typeof schema>;

const FLOWS = {
  employee: {
    endpoint: "/api/auth/employee/accept-invite",
    provider: "employee-login",
    landing: "/my-space",
  },
  account: {
    endpoint: "/api/auth/company/accept-invite",
    provider: "company-login",
    landing: "/dashboard",
  },
} as const;

export function AcceptInviteForm({
  kind,
  token,
  identifier,
}: {
  kind: "employee" | "account";
  token: string;
  /** Employee code or email — whichever their login provider expects. */
  identifier: string;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const flow = FLOWS[kind];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const response = await fetch(flow.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: values.password }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setFormError(body?.error ?? "Could not set your password.");
      return;
    }

    const credentials =
      kind === "employee"
        ? {
            companySlug: body.companySlug,
            identifier,
            password: values.password,
          }
        : {
            workEmail: body.workEmail,
            companySlug: body.companySlug,
            password: values.password,
          };

    const result = await signIn(flow.provider, {
      ...credentials,
      redirect: false,
    });

    if (result?.error) {
      setFormError(
        "Your password was set, but signing in failed. Please sign in manually."
      );
      return;
    }

    router.push(flow.landing);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={formError} />

      <FormField
        id="password"
        label="Choose a password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        error={errors.password?.message}
        {...register("password")}
      />

      <FormField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Setting your password…" : "Set password and sign in"}
      </Button>
    </form>
  );
}
