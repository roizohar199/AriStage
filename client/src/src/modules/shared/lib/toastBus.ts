export type ToastType = "success" | "error" | "info" | "warning";
export type ToastListener = (message: string, type: ToastType) => void;

const listeners: ToastListener[] = [];

export function emitToast(message: string, type: ToastType = "error") {
  listeners.forEach((cb) => cb(message, type));
}

export function onToast(cb: ToastListener) {
  listeners.push(cb);

  return () => {
    const index = listeners.indexOf(cb);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  };
}
