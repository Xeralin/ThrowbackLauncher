export function SeasonTable({
  caption,
  rows,
  className,
}: {
  caption?: string;
  rows: [string, string, string][];
  className?: string;
}) {
  return (
    <div className={`mb-5 w-fit${className ? ` ${className}` : ""}`}>
      {caption ? (
        <div className="mb-1.5 font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">
          {caption}
        </div>
      ) : null}
      <div className="w-fit overflow-hidden rounded-lg border border-border">
        <table>
          <thead>
            <tr>
              <th>Season</th>
              <th>Operation</th>
              <th>Build</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([season, operation, build]) => (
              <tr key={build}>
                <td>{season}</td>
                <td>{operation}</td>
                <td>{build ? <code>{build}</code> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
