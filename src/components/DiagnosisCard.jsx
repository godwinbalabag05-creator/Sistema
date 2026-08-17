function DiagnosisCard({ title, description, severity }) {
  return (
    <div className="diagnosis-card">
      <div className="diagnosis-header">
        <h3>{title}</h3>

        <span className={`severity ${severity}`}>
          {severity}
        </span>
      </div>

      <p>{description}</p>

      <button type="button">
        View Details
      </button>
    </div>
  );
}

export default DiagnosisCard;