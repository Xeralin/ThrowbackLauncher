import type { SeasonRow } from "@/config/liberator-builds";

export function SeasonTable({
  caption,
  rows,
  showEvent,
  showVersion,
}: {
  caption?: string;
  rows: SeasonRow[];
  showEvent?: boolean;
  showVersion?: boolean;
}) {
  return (
    <div className="mb-5 w-fit">
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
              {showEvent ? <th>Event</th> : null}
              {showVersion ? <th>Version</th> : null}
              <th>Build</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ season, operation, event, version, build }) => (
              <tr key={build}>
                <td>{season}</td>
                <td>{operation}</td>
                {showEvent ? <td>{event ?? null}</td> : null}
                {showVersion ? <td>{version ?? null}</td> : null}
                <td>{build ? <code>{build}</code> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
