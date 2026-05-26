import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border text-sm font-semibold uppercase tracking-[0.12em] ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-300",
  {
    variants: {
      variant: {
        default:
          "border-[#ff9b53]/30 bg-[linear-gradient(135deg,rgba(255,142,48,0.98),rgba(255,184,120,0.92))] text-[#0F0F10] shadow-[0_22px_42px_-20px_rgba(255,130,32,0.5)] hover:-translate-y-0.5 hover:border-[#ffd2ad]/55 hover:shadow-[0_28px_56px_-18px_rgba(255,130,32,0.62)] hover:[&_svg]:translate-x-0.5",
        destructive:
          "border-red-400/30 bg-red-500/85 text-white shadow-[0_18px_34px_-18px_rgba(239,68,68,0.52)] hover:-translate-y-0.5 hover:bg-red-500",
        outline:
          "border-white/14 bg-white/[0.03] text-foreground shadow-[0_12px_26px_-20px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 hover:border-[#ff9b53]/45 hover:bg-[rgba(255,130,32,0.08)] hover:text-white hover:shadow-[0_22px_46px_-22px_rgba(255,130,32,0.2)]",
        secondary:
          "border-white/10 bg-white/[0.06] text-foreground shadow-[0_12px_24px_-18px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 hover:bg-white/[0.1]",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:-translate-y-0.5 hover:border-[#ff9b53]/20 hover:bg-[rgba(255,130,32,0.06)] hover:text-white hover:shadow-[0_16px_32px_-24px_rgba(255,130,32,0.22)]",
        link: "rounded-none border-none px-0 shadow-none text-primary underline-offset-4 hover:text-white hover:underline active:scale-100",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-[0.7rem]",
        lg: "h-12 px-8",
        icon: "h-11 w-11 rounded-full p-0",
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
