import * as React from "react"

import { cn } from "@/lib/utils"

/** macOS text field: white, hairline edge, faint inset at the top; the focus ring comes from globals.css. */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-md border border-input bg-white px-2.5 py-1 text-body text-label shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] transition-colors file:border-0 file:bg-transparent file:text-body file:font-medium file:text-foreground placeholder:text-label-3 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
