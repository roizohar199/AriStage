const listeners = [];

export function emitToast(message, type = "error") {
  listeners.forEach((cb) => cb(message, type));
}

export function onToast(cb) {
  listeners.push(cb);
}
