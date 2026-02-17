'use client'

import { useForm, type UseFormProps, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodSchema, z } from 'zod'

/**
 * useZodForm - Convenience wrapper around react-hook-form with Zod schema validation.
 * 
 * Combines useForm + zodResolver in a single call for consistent form handling.
 * 
 * @example
 * ```tsx
 * const form = useZodForm(loginSchema, { defaultValues: { email: '', password: '' } })
 * 
 * <form onSubmit={form.handleSubmit(onSubmit)}>
 *   <input {...form.register('email')} />
 *   {form.formState.errors.email && <span>{form.formState.errors.email.message}</span>}
 * </form>
 * ```
 */
export function useZodForm<T extends FieldValues>(
  schema: ZodSchema<T>,
  props?: Omit<UseFormProps<T>, 'resolver'>
) {
  return useForm<T>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    ...props,
  })
}

/**
 * Type helper to extract the inferred type from a Zod schema.
 * Useful for typing form submit handlers.
 */
export type FormData<S extends ZodSchema> = z.infer<S>
