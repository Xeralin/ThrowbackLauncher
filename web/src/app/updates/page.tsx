"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { useUpdate } from "@/lib/bridge";

export default function UpdatesPage() {
  const [log, setLog] = useState<string[]>([]);
  const update = useUpdate({
    onLog: (line) => setLog((prev) => [...prev, line].slice(-200)),
    onFinished: () => setLog([]),
  });

  return (
    <>
      <h1 className="mb-6 font-display text-[1.9rem] font-bold text-text">
        Updates
      </h1>

      <div className="flex max-w-[600px] flex-col gap-4">
        {update.checking && update.components.length === 0 ? (
          <p className="font-mono text-ui text-text-muted">
            Checking for updates…
          </p>
        ) : update.components.length === 0 ? (
          <p className="font-mono text-ui text-text-muted">
            Everything is up to date.
          </p>
        ) : (
          update.components.map((component, index) => (
            <div
              key={component.name}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-4"
            >
              <div className="flex flex-col gap-1">
                <div className="font-display text-[1.05rem] font-semibold text-text">
                  {component.name}
                </div>
                <div className="font-mono text-label text-text-muted">
                  {component.current} → {component.target}
                </div>
              </div>
              <Button
                variant="primary"
                disabled={update.busy}
                onClick={() => update.apply(index)}
              >
                Update
              </Button>
            </div>
          ))
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            disabled={update.checking || update.busy}
            onClick={() => update.check()}
          >
            Check again
          </Button>
          {update.busy && (
            <span className="font-mono text-label text-text-muted">
              Updating…
            </span>
          )}
        </div>

        {log.length > 0 && (
          <div className="h-[180px] overflow-auto rounded-lg border border-border bg-[#0c0c0f] p-3 font-mono text-label leading-[1.5] text-text-muted">
            {log.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap break-words">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
