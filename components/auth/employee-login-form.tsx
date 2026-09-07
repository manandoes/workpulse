"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/forms/fields";
import {
  employeeLoginSchema,
  type EmployeeLoginInput,
} from "@/lib/validations/auth";

/**
 * Employee login form (PRD.md section 6.0.1).
 *
 * A different shape from the company form: an employee is always scoped to one
 * company, so the company ID is required. Submits to the `employee-login`
 * provider, which only ever reads the Employee table.
 */
export function EmployeeLoginForm({
  defaultCompanySlug = "",
}: {
  defaultCompanySlug?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeLoginInput>({
    resolver: zodResolver(employeeLoginSchema),
    defaultValues: {
      companySlug: defaultCompanySlug,
      identifier: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const result = await signIn("employee-login", {
      ...values,
      redirect: false,
    });

    if (result?.error) {
      if (result.code === "invite_pending") {
        setFormError(
          "You have not set a password yet. Open the invite link your company sent you."
        );
        return;
      }
      if (result.code === "account_suspended") {
        setFormError(
          "Your account is suspended. Please contact your HR or admin team."
        );
        return;
      }

      setFormError("Those details did not match an employee account.");
      return;
    }

    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/my-space");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={formError} />

      <FormField
        id="companySlug"
        label="Company ID"
        placeholder="your-agency"
        autoComplete="organization"
        hint="Given to you by your company."
        error={errors.companySlug?.message}
        {...register("companySlug")}
      />

      <FormField
        id="identifier"
        label="Employee ID or work email"
        placeholder="EMP-001"
        autoComplete="username"
        error={errors.identifier?.message}
        {...register("identifier")}
      />

      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
