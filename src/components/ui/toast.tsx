import React, { useEffect, useState } from 'react';
import { onToast } from '@/lib/notifications';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = onToast((event) => {
      setToasts((prev) => [...prev, event]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== event.id));
      }, 5000);
    });
    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-indigo-500/30';
        let bgClass = 'bg-white dark:bg-gray-900';
        let Icon = Info;
        let iconColor = 'text-indigo-500';

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500/40';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-500';
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-500/40';
          Icon = AlertCircle;
          iconColor = 'text-rose-500';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500/40';
          Icon = AlertTriangle;
          iconColor = 'text-amber-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgClass} ${borderClass} transition-all duration-300 transform translate-y-0`}
          >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{toast.title}</p>
              {toast.description && (
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
