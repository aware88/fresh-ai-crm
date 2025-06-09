"use client"

import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => {
        if (!toast.open) return null;
        
        const variantClassNames = {
          default: "bg-white border-gray-200",
          destructive: "bg-red-50 border-red-200 text-red-800",
          success: "bg-green-50 border-green-200 text-green-800"
        };
        
        return (
          <div 
            key={toast.id} 
            className={`group pointer-events-auto relative flex w-full items-center justify-between overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all mb-2 ${variantClassNames[toast.variant || 'default']}`}
          >
            <div className="grid gap-1">
              {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
              {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
            </div>
            {toast.action}
            <button 
              onClick={() => toast.onOpenChange?.(false)}
              className="absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:text-gray-900 focus:opacity-100 focus:outline-none group-hover:opacity-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  )
}
