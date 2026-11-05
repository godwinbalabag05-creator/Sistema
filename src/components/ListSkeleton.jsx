function ListSkeleton({ rows = 3 }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="skeleton-card">
          <span className="skeleton-line w40" />
          <span className="skeleton-line w70" />
          <span className="skeleton-line w25" />
        </div>
      ))}
    </div>
  );
}

export default ListSkeleton;