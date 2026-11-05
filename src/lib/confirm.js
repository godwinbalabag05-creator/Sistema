let handler = null;

export function registerConfirmHandler(fn) {
  handler = fn;

  return () => {
    if (handler === fn) handler = null;
  };
}

// Returns a promise that resolves true (confirmed) or false (cancelled)
export function confirmDialog(options) {
  if (!handler) {
    return Promise.resolve(window.confirm(options.message ?? options.title));
  }

  return handler(options);
}