export default function SkeletonTable({ rows = 6, cols = 7 }) {
  const widths = ['60%', '80%', '70%', '50%', '40%', '55%', '45%'];
  return (
    <table className="skeleton-table">
      <thead>
        <tr>
          {Array.from({ length: cols }, (_, i) => (
            <th key={i}>
              <div
                className="skeleton skeleton-table__cell"
                style={{ width: widths[i % widths.length], height: '16px' }}
              />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => (
              <td key={c}>
                <div
                  className="skeleton skeleton-table__cell"
                  style={{ width: widths[(r + c) % widths.length], height: '16px' }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
