"use client";
import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * macOS push button. 28px tall by default, 13px text, a hairline edge and a
 * faint top highlight on the filled variant; presses scale down a hair.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-body font-medium transition-[background-color,box-shadow,transform,color] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-white shadow-[0_1px_1px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-brand-700 active:bg-brand-800",
        destructive:
          "bg-destructive text-white shadow-[0_1px_1px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-[#B80012]",
        outline:
          "border border-input bg-white text-label shadow-mac-sm hover:bg-surface active:bg-surface-2",
        secondary: "bg-surface-2 text-label hover:bg-[#E0E0E3] active:bg-[#D6D6DA]",
        ghost: "text-label hover:bg-black/[0.05] active:bg-black/[0.08]",
        link: "text-brand-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3.5",
        sm: "h-7 rounded-[6px] px-2.5 text-footnote",
        lg: "h-10 px-5 text-callout",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
