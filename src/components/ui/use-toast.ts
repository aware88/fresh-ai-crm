// Simplified toast hook
import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000 // 5 seconds

type ToasterToast = ToastProps

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

// Actions
function addToast(toast: ToasterToast) {
  const nextState = {
    ...memoryState,
    toasts: [toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
  }
  memoryState = nextState
  listeners.forEach((listener) => listener(nextState))

  // Auto dismiss after delay
  if (toast.id) {
    const timeout = setTimeout(() => {
      dismissToast(toast.id)
    }, TOAST_REMOVE_DELAY)
    toastTimeouts.set(toast.id, timeout)
  }
}

function updateToast(toast: Partial<ToasterToast> & { id: string }) {
  const nextState = {
    ...memoryState,
    toasts: memoryState.toasts.map((t) =>
      t.id === toast.id ? { ...t, ...toast } : t
    ),
  }
  memoryState = nextState
  listeners.forEach((listener) => listener(nextState))
}

function dismissToast(toastId?: string) {
  // First set open to false
  const nextState = {
    ...memoryState,
    toasts: memoryState.toasts.map((t) =>
      toastId === undefined || t.id === toastId
        ? { ...t, open: false }
        : t
    ),
  }
  memoryState = nextState
  listeners.forEach((listener) => listener(nextState))

  // Then remove after a delay
  if (toastId) {
    if (toastTimeouts.has(toastId)) {
      clearTimeout(toastTimeouts.get(toastId))
      toastTimeouts.delete(toastId)
    }
    
    setTimeout(() => {
      removeToast(toastId)
    }, 300) // Animation duration
  }
}

function removeToast(toastId?: string) {
  const nextState = {
    ...memoryState,
    toasts: toastId
      ? memoryState.toasts.filter((t) => t.id !== toastId)
      : [],
  }
  memoryState = nextState
  listeners.forEach((listener) => listener(nextState))
}

type Toast = Omit<ToasterToast, "id">

function toast(props: Toast) {
  const id = genId()
  
  const newToast: ToasterToast = {
    ...props,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismissToast(id)
    },
  }
  
  addToast(newToast)
  
  return {
    id,
    dismiss: () => dismissToast(id),
    update: (props: Partial<ToasterToast>) => updateToast({ ...props, id }),
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)
  
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])
  
  return {
    ...state,
    toast,
    dismiss: dismissToast,
  }
}

export { useToast, toast }
