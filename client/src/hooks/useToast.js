import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, isError = false) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, isError }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return { toasts, showToast };
}
