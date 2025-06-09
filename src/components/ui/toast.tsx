import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastVariant = "default" | "destructive" | "success"

export type ToastActionElement = React.ReactElement

export interface ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: ToastVariant
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// Separate props type for the Toast component to avoid TypeScript errors
type ToastComponentProps = Omit<React.HTMLAttributes<HTMLDivElement>, keyof ToastProps>

const ToastContext = React.createContext<{
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, "id" | "open">) => void
  removeToast: (id: string) => void
}>({ toasts: [], addToast: () => {}, removeToast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function ToastViewport({ className }: { className?: string }) {
  const { toasts } = React.useContext(ToastContext)
  
  return (
    <div
      className={cn(
        "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
        className
      )}
    >
      {toasts.map((toast) => toast.open && (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps & ToastComponentProps>(
  ({ id, title, description, action, variant = "default", open, onOpenChange, className, ...props }, ref) => {
    const variantClassNames = {
      default: "bg-white border-gray-200",
      destructive: "bg-red-50 border-red-200 text-red-800",
      success: "bg-green-50 border-green-200 text-green-800"
    }
    
    return open ? (
      <div
        ref={ref}
        className={cn(
          "group pointer-events-auto relative flex w-full items-center justify-between overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all mb-2",
          variantClassNames[variant],
          className
        )}
        {...props}
      >
        <div className="grid gap-1">
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
        </div>
        {action}
        <ToastClose onClick={() => onOpenChange?.(false)} />
      </div>
    ) : null
  }
)
Toast.displayName = "Toast"

export function ToastAction({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function ToastClose({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:text-gray-900 focus:opacity-100 focus:outline-none group-hover:opacity-100",
        className
      )}
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  )
}

export function ToastTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-sm font-semibold", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function ToastDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-sm opacity-90", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Types are already exported above
