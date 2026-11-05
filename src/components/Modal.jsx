import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  dismissible = true,
}) {
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    closeRef.current = onClose;
  });

  // Stay mounted for the exit animation
  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return undefined;
    }

    setClosing(true);

    const timer = setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, 180);

    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!rendered) return undefined;

    const returnTo = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const first =
      dialog?.querySelector("[data-autofocus]") ??
      dialog?.querySelector(FOCUSABLE);
    first?.focus();

    function onKey(e) {
      if (e.key === "Escape" && dismissible) {
        e.preventDefault();
        closeRef.current();
        return;
      }

      if (e.key !== "Tab" || !dialogRef.current) return;

      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null
      );

      if (items.length === 0) return;

      const firstItem = items[0];
      const lastItem = items[items.length - 1];

      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (returnTo && returnTo.focus) returnTo.focus();
    };
  }, [rendered, dismissible]);

  if (!rendered) return null;

  return createPortal(
    <div
      className={`modal-overlay ${closing ? "is-closing" : ""}`}
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) closeRef.current();
      }}
    >
      <div
        ref={dialogRef}
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>

          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={() => closeRef.current()}
          >
            ×
          </button>
        </header>

        <div className="modal-body">{children}</div>

        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

export default Modal;