// src/components/Pagination.jsx
export default function Pagination({ page, limit, total, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const LinkBtn = ({ disabled, onClick, children }) => (
    <button
      type="button"
      className={`as-link ${disabled ? "is-disabled" : ""}`}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );

  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
      <LinkBtn disabled={page <= 1} onClick={() => onChange(page - 1)}>
        &laquo;&laquo; Prev
      </LinkBtn>

      {Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`page-pill ${page === p ? "is-active" : ""}`}
          >
            {p}
          </button>
        );
      })}

      <LinkBtn disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next &raquo;&raquo;
      </LinkBtn>
    </div>
  );
}
