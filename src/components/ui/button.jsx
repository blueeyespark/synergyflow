import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-400/30 hover:shadow-cyan-400/50 hover:scale-105 active:scale-95",
        destructive:
          "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-400/30 hover:shadow-red-400/50 hover:scale-105 active:scale-95",
        outline:
          "border-2 border-cyan-500 bg-transparent text-cyan-600 hover:bg-cyan-50 hover:border-cyan-600 active:scale-95",
        secondary:
          "bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg shadow-orange-400/30 hover:shadow-orange-400/50 hover:scale-105 active:scale-95",
        ghost: "text-slate-600 hover:bg-slate-100 active:scale-95",
        link: "text-cyan-600 underline-offset-4 hover:underline hover:text-cyan-700 font-semibold",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }