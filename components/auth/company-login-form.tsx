"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/forms/fields";
import {
  companyLoginSchema,
  type CompanyLoginInput,
} from "@/lib/validations/auth";

/**
 * Company login form (PRD.md section 6.0.1).
 *
 * Submits to the `company-login` provider, which only ever reads the
 * CompanyAccount table (Architecture.md section 8).
 */
export function CompanyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  // Work email is unique per company, so we only ask which company when the
  // server tells us the address matched more than one.
  const [needsCompany, setNeedsCompany] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyLoginInput>({
    resolver: zodResolver(companyLoginSchema),
    defaultValues: { workEmail: "", password: "", companySlug: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const result = await signIn("company-login", {
      ...values,
      redirect: false,
    });

    if (result?.error) {
      if (result.code === "company_required") {
        setNeedsCompany(true);
        setFormError(
          "That email is used at more than one company. Enter your company ID to continue."
        );
        return;
      }

      if (result.code === "invite_pending") {
        setFormError(
          "Your account has not been set up yet. Use the invite link that was sent to you to choose a password."
        );
        return;
      }

      setFormError("Those details did not match a company account.");
      return;
    }

    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={formError} />

      <FormField
        id="workEmail"
        label="Work email"
        type="email"
        autoComplete="email"
        placeholder="you@agency.com"
        error={errors.workEmail?.message}
        {...register("workEmail")}
      />

      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      {needsCompany ? (
        <FormField
          id="companySlug"
          label="Company ID"
          placeholder="your-agency"
          hint="The company ID shown in your workspace URL."
          error={errors.companySlug?.message}
          {...register("companySlug")}
        />
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
