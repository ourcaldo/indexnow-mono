/**
 * Centralized Request Validation Middleware
 *
 * Provides a declarative way to validate request bodies, query parameters,
 * and route parameters against Zod schemas before the handler runs.
 *
 * Usage:
 *   import { withValidation } from '@/lib/core/validation-middleware';
 *   import { z } from 'zod';
 *
 *   const bodySchema = z.object({ email: z.string().email() });
 *
 *   export const POST = authenticatedApiWrapper(
 *     withValidation({ body: bodySchema }, async (request, validated) => {
 *       // validated.body is fully typed
 *       const { email } = validated.body;
 *       ...
 *     })
 *   );
 */

import { NextRequest, NextResponse } from 'next/server';
import { type ZodSchema, type ZodError, z } from 'zod';

// ── Types ──

interface ValidationSchemas {
  /** Zod schema for JSON body (POST/PUT/PATCH/DELETE) */
  body?: ZodSchema;
  /** Zod schema for URL query parameters (searchParams) */
  query?: ZodSchema;
  /** Zod schema for dynamic route params */
  params?: ZodSchema;
}

interface ValidatedData<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
> {
  body: TBody;
  query: TQuery;
  params: TParams;
}

type ValidatedHandler<TBody, TQuery, TParams> = (
  request: NextRequest,
  validated: ValidatedData<TBody, TQuery, TParams>,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

// ── Helpers ──

function formatZodError(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}

// ── Main factory ──

/**
 * Wraps a route handler with Zod validation.
 * Returns a 400 JSON response with structured errors when validation fails.
 *
 * @example
 * ```ts
 * const schema = z.object({ name: z.string().min(1) });
 * export const POST = authenticatedApiWrapper(
 *   withValidation({ body: schema }, async (req, { body }) => {
 *     // body.name is typed as string
 *   })
 * );
 * ```
 */
export function withValidation<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
>(
  schemas: {
    body?: ZodSchema<TBody>;
    query?: ZodSchema<TQuery>;
    params?: ZodSchema<TParams>;
  },
  handler: ValidatedHandler<TBody, TQuery, TParams>,
) {
  return async (
    request: NextRequest,
    context?: { params?: Record<string, string> },
  ): Promise<NextResponse> => {
    const validated: ValidatedData<TBody, TQuery, TParams> = {
      body: undefined as TBody,
      query: undefined as TQuery,
      params: undefined as TParams,
    };

    const allErrors: Array<{
      source: 'body' | 'query' | 'params';
      errors: Record<string, string[]>;
    }> = [];

    // ── Validate body ──
    if (schemas.body) {
      try {
        const raw = await request.json();
        const result = schemas.body.safeParse(raw);
        if (!result.success) {
          allErrors.push({ source: 'body', errors: formatZodError(result.error) });
        } else {
          validated.body = result.data;
        }
      } catch {
        allErrors.push({
          source: 'body',
          errors: { _root: ['Invalid or missing JSON body'] },
        });
      }
    }

    // ── Validate query params ──
    if (schemas.query) {
      const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
      const result = schemas.query.safeParse(searchParams);
      if (!result.success) {
        allErrors.push({ source: 'query', errors: formatZodError(result.error) });
      } else {
        validated.query = result.data;
      }
    }

    // ── Validate route params ──
    if (schemas.params) {
      const routeParams = context?.params ?? {};
      const result = schemas.params.safeParse(routeParams);
      if (!result.success) {
        allErrors.push({ source: 'params', errors: formatZodError(result.error) });
      } else {
        validated.params = result.data;
      }
    }

    // ── Return errors if any ──
    if (allErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          validationErrors: allErrors,
        },
        { status: 400 },
      );
    }

    return handler(request, validated, context);
  };
}
