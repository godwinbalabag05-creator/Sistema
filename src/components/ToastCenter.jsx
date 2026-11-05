import { useNavigate } from "react-router-dom";
import NotifIcon from "./NotifIcon";

import { useNotifications } from "../lib/NotificationContext";
import { kindOf } from "../lib/notificationUtils";

function ToastCenter() {
  const navigate = useNavigate();
  const { toasts, dismissToast, markRead } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast kind-${kindOf(toast.type)}`}>
          <button
            type="button"
            className="toast-main"
            onClick={() => {
              markRead(toast.id);
              dismissToast(toast.id);
              if (toast.link) navigate(toast.link);
            }}
          >
            <NotifIcon type={toast.type} />
            <strong>{toast.title}</strong>
            <span>{toast.body}</span>
          </button>

          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss"
            onClick={() => dismissToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastCenter;