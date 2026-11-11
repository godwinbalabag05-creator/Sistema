function DiagnosisCard({ title, description, severity, meta, onOpen }) {
  return (
    <div className="diagnosis-card">
      <div className="diagnosis-header">
        <h3>{title}</h3>

        <span className={`severity ${severity}`}>
          {severity}
        </span>
      </div>

      {meta && <span className="diagnosis-meta">{meta}</span>}

      <p>{description}</p>

      <button type="button" onClick={onOpen}>
        View Details
      </button>
    </div>
  );
}

export default DiagnosisCard;