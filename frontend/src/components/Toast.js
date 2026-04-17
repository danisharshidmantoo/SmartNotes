import React, { useState, useCallback } from "react";

let addToastFn = null;

export const toast = {
  success: (msg) => addToastFn?.({ msg, type: "success" }),
  error: (msg) => addToastFn?.({ msg, type: "error" }),
  info: (msg) => addToastFn?.({ msg, type: "info" }),
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  addToastFn = useCallback(({ msg, type }) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}
