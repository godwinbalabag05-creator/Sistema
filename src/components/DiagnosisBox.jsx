const ADVICE = {
  drive_normally: "Safe to keep driving normally.",
  drive_carefully: "Drive carefully and get it checked soon.",
  do_not_drive: "Do not drive. Arrange a tow or roadside help.",
};

function DiagnosisBox({ diagnosis }) {
  if (!diagnosis) return null;

  return (
    <div className="diagnosis-box">
      <div className="diagnosis-box-head">
        <h4>AI diagnosis</h4>
        <span className={`severity ${diagnosis.severity}`}>
          {diagnosis.severity}
        </span>
      </div>

      <p className="diagnosis-box-title">{diagnosis.title}</p>
      <p>{diagnosis.summary}</p>

      {diagnosis.driving_advice && (
        <div className={`driving-advice ${diagnosis.driving_advice}`}>
          {ADVICE[diagnosis.driving_advice]}
        </div>
      )}

      {diagnosis.causes?.length > 0 && (
        <>
          <span className="diagnosis-box-label">Likely causes</span>
          <ul>
            {diagnosis.causes.map((cause) => (
              <li key={cause}>{cause}</li>
            ))}
          </ul>
        </>
      )}

      {diagnosis.recommended_action && (
        <p>
          <strong>Recommended:</strong> {diagnosis.recommended_action}
        </p>
      )}

      <p className="diagnosis-disclaimer">
        AI-generated estimate, not a mechanic's inspection.
      </p>
    </div>
  );
}

export default DiagnosisBox;