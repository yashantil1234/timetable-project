import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind classes conditionally.
 * Example: cn("px-2", condition && "bg-red-500")
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
