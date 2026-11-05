import { useEffect, useState } from "react";

import Modal from "./Modal";
import { registerConfirmHandler } from "../lib/confirm";

function ConfirmHost() {
  const [request, setRequest] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(
    () =>
      registerConfirmHandler(
        (options) =>
          new Promise((resolve) => {
            setRequest({ options, resolve });
            setOpen(true);
          })
      ),
    []
  );

  function finish(result) {
    setOpen(false);
    request?.resolve(result);
  }

  const options = request?.options ?? {};

  return (
    <Modal
      open={open}
      onClose={() => finish(false)}
      title={options.title ?? "Are you sure?"}
      size="sm"
      footer={
        <>
          <button
            type="button"
            className="secondary-button"
            data-autofocus
            onClick={() => finish(false)}
          >
            {options.cancelLabel ?? "Cancel"}
          </button>

          <button
            type="button"
            className={`primary-button ${options.danger ? "danger-button" : ""}`}
            onClick={() => finish(true)}
          >
            {options.confirmLabel ?? "Confirm"}
          </button>
        </>
      }
    >
      <p className="modal-text">{options.message}</p>
    </Modal>
  );
}

export default ConfirmHost;