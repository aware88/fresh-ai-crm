import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Ripple } from "@/components/magicui/ripple"

const rippleButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white shadow-xs hover:bg-green-700",
        warning: "bg-yellow-600 text-white shadow-xs hover:bg-yellow-700",
        info: "bg-blue-600 text-white shadow-xs hover:bg-blue-700",
        premium: "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:from-purple-700 hover:to-blue-700",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-9 w-9",
      },
      rippleEffect: {
        none: "",
        subtle: "",
        normal: "",
        strong: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rippleEffect: "normal",
    },
  }
)

export interface RippleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rippleButtonVariants> {
  asChild?: boolean
  rippleColor?: string
}

const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ className, variant, size, rippleEffect, rippleColor, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const [isClicked, setIsClicked] = React.useState(false)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (rippleEffect !== "none") {
        setIsClicked(true)
        setTimeout(() => setIsClicked(false), 600)
      }
      
      if (props.onClick) {
        props.onClick(e)
      }
    }

    const getRippleColor = () => {
      if (rippleColor) return rippleColor
      
      switch (variant) {
        case "default":
        case "premium":
          return "rgba(255, 255, 255, 0.3)"
        case "destructive":
          return "rgba(255, 255, 255, 0.4)"
        case "success":
          return "rgba(255, 255, 255, 0.3)"
        case "warning":
          return "rgba(255, 255, 255, 0.3)"
        case "info":
          return "rgba(255, 255, 255, 0.3)"
        case "outline":
        case "secondary":
        case "ghost":
          return "rgba(59, 130, 246, 0.2)"
        default:
          return "rgba(255, 255, 255, 0.2)"
      }
    }

    return (
      <Comp
        className={cn(rippleButtonVariants({ variant, size, rippleEffect, className }))}
        ref={ref}
        {...props}
        onClick={handleClick}
      >
        {children}
        {rippleEffect !== "none" && isClicked && (
          <Ripple 
            mainCircleSize={rippleEffect === "subtle" ? 100 : rippleEffect === "strong" ? 300 : 200}
            numCircles={rippleEffect === "subtle" ? 3 : rippleEffect === "strong" ? 8 : 5}
            className="absolute inset-0 pointer-events-none"
            style={{ 
              "--ripple-color": getRippleColor(),
            } as React.CSSProperties}
          />
        )}
      </Comp>
    )
  }
)
RippleButton.displayName = "RippleButton"

export { RippleButton, rippleButtonVariants }

