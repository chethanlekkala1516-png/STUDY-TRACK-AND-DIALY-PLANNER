type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastEvent {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

type ToastListener = (event: ToastEvent) => void;

const listeners: Set<ToastListener> = new Set();

export function onToast(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let toastId = 0;

export function toast({
  title,
  description,
  type = 'info',
}: {
  title: string;
  description?: string;
  type?: ToastType;
}) {
  const event: ToastEvent = { id: String(++toastId), title, description, type };
  listeners.forEach(l => l(event));
}
