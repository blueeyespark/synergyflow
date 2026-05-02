import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#1e78ff] text-white shadow-lg shadow-blue-900/50 hover:bg-[#3d8fff] hover:shadow-blue-500/40 hover:shadow-xl active:scale-95 border border-blue-500/30",
        destructive:
          "bg-red-600 text-white shadow-lg shadow-red-900/50 hover:bg-red-500 active:scale-95",
        outline:
          "border border-[#1e78ff]/50 bg-transparent text-[#1e78ff] hover:bg-[#1e78ff]/10 hover:border-[#1e78ff] active:scale-95",
        secondary:
          "bg-[#0d1a2e] text-blue-200 border border-blue-900/40 hover:bg-[#1a2d4a] hover:border-blue-600/50 active:scale-95",
        ghost: "text-blue-300 hover:bg-blue-900/20 hover:text-blue-100 active:scale-95",
        link: "text-[#1e78ff] underline-offset-4 hover:underline hover:text-[#00c8ff] font-semibold",
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
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }