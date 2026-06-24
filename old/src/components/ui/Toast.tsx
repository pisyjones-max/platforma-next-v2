'use client'
import type { Toast } from '@/hooks/useToast'

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type} px-4 py-2 rounded-xl text-sm shadow`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
