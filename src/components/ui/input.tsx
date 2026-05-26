import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-foreground shadow-[0_18px_40px_-28px_rgba(0,0,0,0.85)] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/80 transition-all duration-300 ease-out hover:border-[#BFC3C9]/35 hover:bg-white/[0.06] focus-visible:border-[#BFC3C9]/60 focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
