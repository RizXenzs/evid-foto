"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastItem extends ToastProps {
  id: string
}

// Global toast state
let _setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>> | null = null

export function useToast() {
  return {
    toast: (props: ToastProps) => {
      if (!_setToasts) {
        console.warn('Toast called before Toaster was mounted')
        return
      }
      const id = Math.random().toString(36).slice(2)
      _setToasts(prev => [...prev, { ...props, id }])
      setTimeout(() => {
        _setToasts?.(prev => prev.filter(t => t.id !== id))
      }, 4000)
    }
  }
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  React.useEffect(() => {
    _setToasts = setToasts
    return () => { _setToasts = null }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            "flex flex-col gap-1 p-4 rounded-xl border shadow-2xl pointer-events-auto",
            "animate-in slide-in-from-right-5 fade-in duration-300",
            toast.variant === 'destructive'
              ? "bg-red-950 border-red-800 text-red-100"
              : "bg-card border-border text-foreground"
          )}
        >
          {toast.title && (
            <p className="font-semibold text-sm">{toast.title}</p>
          )}
          {toast.description && (
            <p className={cn(
              "text-xs",
              toast.variant === 'destructive' ? "text-red-300" : "text-muted-foreground"
            )}>
              {toast.description}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

