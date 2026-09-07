import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Consistent API responses (Rules.md section 4).
 *
 * Every route returns errors as `{ error, code? }` with a sensible status, and
 * never leaks a stack trace or a raw database message to the client.
 */
export type ApiError = { error: string; code?: string };

export function apiError(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    code ? { error: message, code } : { error: message },
    {
      status,
    }
  );
}

export function unauthorized(message = "You must be signed in.") {
  return apiError(message, 401, "unauthorized");
}

export function forbidden(message = "You do not have access to do that.") {
  return apiError(message, 403, "forbidden");
}

/**
 * Turns a Zod failure into a field-keyed map the forms can display inline,
 * alongside the standard `error` string.
 */
export function validationError(error: ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path.join(".");
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }

  return NextResponse.json(
    {
      error: "Please check the highlighted fields.",
      code: "validation_error",
      fieldErrors,
    },
    { status: 400 }
  );
}

/**
 * Logs the real cause server-side with enough context to debug, and returns a
 * generic message to the client (Rules.md section 4 — never leak internals).
 */
export function serverError(
  context: { route: string; companyId?: string; actorId?: string },
  cause: unknown
) {
  console.error("[api-error]", { ...context, cause });
  return apiError(
    "Something went wrong. Please try again.",
    500,
    "server_error"
  );
}

/**
 * A write a resolver in `lib/*-data.ts` refused.
 *
 * The shape lives here, beside the responder that renders it, so every resolver
 * speaks one vocabulary of failures and every route turns them into the same
 * JSON.
 */
export type WriteFailure = {
  ok: false;
  message: string;
  status: number;
  code: string;
  field?: string;
};

/** A value that clashes with a record that already exists. */
export const duplicateFailure = (
  field: string,
  message: string
): WriteFailure => ({
  ok: false,
  status: 409,
  code: "duplicate",
  field,
  message,
});

/**
 * An id that does not name a record in the caller's own company. Deliberately
 * indistinguishable from "no such record": the resolver looked through the
 * tenant filter, so it cannot tell the two apart either (Rules.md section 2).
 */
export const invalidReference = (
  field: string,
  message: string
): WriteFailure => ({
  ok: false,
  status: 400,
  code: "invalid_reference",
  field,
  message,
});

/**
 * A refused write, rendered in the standard error shape.
 *
 * Field-level failures (a duplicate name, a client from another company) also
 * come back keyed by field so the form can mark the input that caused them,
 * exactly as `validationError` does for a Zod failure.
 */
export function writeFailure(failure: {
  message: string;
  status: number;
  code: string;
  field?: string;
}) {
  return NextResponse.json(
    {
      error: failure.message,
      code: failure.code,
      ...(failure.field
        ? { fieldErrors: { [failure.field]: failure.message } }
        : {}),
    },
    { status: failure.status }
  );
}
