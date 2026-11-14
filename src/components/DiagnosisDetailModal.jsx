import { Link } from "react-router-dom";

import Modal from "./Modal";
import { formatDate, vehicleName } from "../lib/diagnosisUtils";

const ADVICE = {
  drive_normally: "Safe to keep driving normally.",
  drive_carefully: "Drive carefully and get it checked soon.",
  do_not_drive: "Do not drive. Arrange a tow or roadside help.",
};

function DiagnosisDetailModal({ open, onClose, diagnosis }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={diagnosis?.title ?? "Diagnosis"}
      size="md"
      footer={
        <>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Close
          </button>

          {diagnosis && (
            <Link
              to={`/shops?category=${diagnosis.service_category ?? ""}&diagnosis=${diagnosis.id}`}
              className="primary-button"
              onClick={onClose}
            >
              Find a mechanic
            </Link>
          )}
        </>
      }
    >
      {diagnosis && (
        <div className="diagnosis-detail">
          <div className="diagnosis-detail-top">
            <span className={`severity ${diagnosis.severity}`}>
              {diagnosis.severity}
            </span>
            <span className="diagnosis-meta">
              {vehicleName(diagnosis)}, {formatDate(diagnosis.created_at)}
            </span>
          </div>

          <p className="modal-text">{diagnosis.summary}</p>

          {diagnosis.driving_advice && (
            <div className={`driving-advice ${diagnosis.driving_advice}`}>
              {ADVICE[diagnosis.driving_advice]}
            </div>
          )}

          <h3>Possible causes</h3>
          <ul>
            {(diagnosis.causes ?? []).map((cause) => (
              <li key={cause}>{cause}</li>
            ))}
          </ul>

          <h3>Recommended action</h3>
          <p className="modal-text">{diagnosis.recommended_action}</p>

          <p className="diagnosis-disclaimer">{diagnosis.disclaimer}</p>
        </div>
      )}
    </Modal>
  );
}

export default DiagnosisDetailModal;