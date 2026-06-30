export function SeasonTable({
  caption,
  rows,
  className,
  fill,
}: {
  caption?: string;
  rows: [string, string, string][];
  className?: string;
  fill?: boolean;
}) {
  const width = fill ? "w-full" : "w-fit";
  return (
    <div className={`mb-5 ${width}${className ? ` ${className}` : ""}`}>
      {caption ? (
        <div className="mb-1.5 font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">
          {caption}
        </div>
      ) : null}
      <div className={`${width} overflow-hidden rounded-lg border border-border`}>
        <table className={fill ? "w-full" : undefined}>
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
                <td>{build.trim() ? <code>{build}</code> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
