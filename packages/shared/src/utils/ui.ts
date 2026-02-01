import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines tailwind classes with clsx and twMerge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
