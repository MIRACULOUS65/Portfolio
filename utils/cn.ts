import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional class names and de-duplicates conflicting Tailwind
 * utilities (last one wins). Every component composes class names through this
 * helper so `className` overrides passed from callers always take effect.
 *
 * This is also the `utils` target configured in `components.json`, so
 * shadcn/ui primitives generated into `components/ui/` import `cn` from here.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
