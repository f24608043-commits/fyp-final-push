import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-label-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-[24px] active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-text-primary shadow-clay-primary hover:bg-primary-dark active:shadow-clay-primary-pressed",
        destructive:
          "bg-error text-text-primary shadow-clay-error hover:brightness-95 active:shadow-clay-surface-pressed",
        outline:
          "border border-surface-border bg-surface text-text-primary shadow-clay-surface hover:bg-surface-border active:shadow-clay-surface-pressed",
        secondary:
          "bg-secondary text-text-primary shadow-clay-secondary hover:brightness-95 active:shadow-clay-surface-pressed",
        tertiary:
          "bg-tertiary text-text-primary shadow-clay-tertiary hover:brightness-95 active:shadow-clay-surface-pressed",
        ghost:
          "text-text-muted hover:bg-surface-border hover:text-text-primary hover:shadow-clay-surface",
        link: "text-primary underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-[24px] px-3 text-xs",
        lg: "h-10 rounded-[24px] px-8",
        icon: "h-9 w-9 rounded-[24px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
