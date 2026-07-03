import type { ReactNode } from "react";
import { Tag } from "@/components/Tag";
import type { SeasonWikiEntry } from "@/config/season-wiki";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <th
        scope="row"
        className="border-r border-border bg-surface-2 px-[0.6rem] py-[0.35rem] text-left align-top font-mono text-[0.66rem] font-normal uppercase tracking-[0.05em] text-text-muted"
      >
        {label}
      </th>
      <td className="px-[0.6rem] py-[0.35rem] text-text-muted">{children}</td>
    </tr>
  );
}

export function SeasonWiki({ entry }: { entry: SeasonWikiEntry }) {
  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <p className="text-body leading-[1.75] text-text-muted">
        {entry.summary}
      </p>

      <div className="w-fit overflow-hidden rounded-lg border border-border">
        <table className="border-collapse text-[0.78rem]">
          <tbody>
            <Row label="Released">
              <span className="text-text">{entry.release}</span>
            </Row>
            <Row label="Maps">
              {entry.maps.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {entry.maps.map((map) => (
                    <span key={map.name} className="flex items-center gap-2">
                      <span className="text-text">{map.name}</span>
                      <Tag>{map.kind === "new" ? "New" : "Rework"}</Tag>
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              )}
            </Row>
            <Row label="Operators">
              {entry.operators.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {entry.operators.map((op) => (
                    <span
                      key={op.name}
                      className="flex flex-wrap items-center gap-x-2 gap-y-0.5"
                    >
                      <span className="text-text">{op.name}</span>
                      <Tag>
                        {op.side === "attacker" ? "Attacker" : "Defender"}
                      </Tag>
                      <span>
                        {op.ctu} · {op.gadget}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              )}
            </Row>
          </tbody>
        </table>
      </div>

      <div>
        <p className="mb-2 font-mono text-label uppercase tracking-[0.12em] text-text-muted">
          Highlights
        </p>
        <ul className="list-disc pl-[1.4rem] text-body leading-[1.75] text-text-muted">
          {entry.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
