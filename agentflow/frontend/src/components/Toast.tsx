import { create } from "zustand";
import { CheckCircle, XCircle, Info } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = "info") => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts.slice(-4), { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const colorMap = {
  success: "border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-850 text-emerald-800 dark:text-emerald-200",
  error: "border-red-200 dark:border-red-800 bg-white dark:bg-gray-850 text-red-800 dark:text-red-200",
  info: "border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-850 text-blue-800 dark:text-blue-200",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg text-sm font-medium ${colorMap[toast.type]}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100 flex-shrink-0 transition-opacity">&times;</button>
          </div>
        );
      })}
    </div>
  );
}
