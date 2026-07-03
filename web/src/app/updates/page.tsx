"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { LogBox, type LogLine } from "@/components/LogBox";
import { ExternalLink } from "@/components/ExternalLink";
import { useDownloader, useUpdate, type UpdateComponent } from "@/lib/bridge";
import { dismissToast, showToast } from "@/lib/toast";

const STATUS_KEY = "update-status";

function groupNotes(notes: UpdateComponent["notes"]) {
  const groups: { text: string; children: string[] }[] = [];
  for (const note of notes) {
    if (note.level > 0 && groups.length > 0) {
      groups[groups.length - 1].children.push(note.text);
    } else {
      groups.push({ text: note.text, children: [] });
    }
  }
  return groups;
}

const CODE_TOKEN = /(`[^`]+`)/g;
const CODE_EXACT = /^`[^`]+`$/;
const LINK_TOKEN = /(\[[^\]]+\]\((?:[^()\s]|\([^()\s]*\))+\))/g;
const LINK_EXACT = /^\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)$/;
const EMPHASIS_TOKEN =
  /(\*\*[^\s*](?:[^*]*[^\s*])?\*\*|\*[^\s*](?:[^*]*[^\s*])?\*|(?<!\w)_[^\s_](?:[^_]*[^\s_])?_(?!\w))/g;
const BOLD_EXACT = /^\*\*[^\s*](?:[^*]*[^\s*])?\*\*$/;
const EM_EXACT = /^\*[^\s*](?:[^*]*[^\s*])?\*$|^_[^\s_](?:[^_]*[^\s_])?_$/;

function renderEmphasis(text: string) {
  return text.split(EMPHASIS_TOKEN).map((part, index) => {
    if (BOLD_EXACT.test(part)) {
      return (
        <strong key={index} className="font-semibold text-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (EM_EXACT.test(part)) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderLinks(text: string) {
  return text.split(LINK_TOKEN).map((part, index) => {
    const link = LINK_EXACT.exec(part);
    if (link) {
      return (
        <ExternalLink
          key={index}
          href={link[2]}
          className="text-[#5b9bd4] hover:underline"
        >
          {link[1]}
        </ExternalLink>
      );
    }
    return <Fragment key={index}>{renderEmphasis(part)}</Fragment>;
  });
}

function renderNote(note: string) {
  return note.split(CODE_TOKEN).map((part, index) => {
    if (CODE_EXACT.test(part)) {
      return (
        <code
          key={index}
          className="rounded border border-border bg-surface-2 px-[0.4em] py-[0.1em] font-mono text-[0.85em] text-text"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={index}>{renderLinks(part)}</Fragment>;
  });
}

export default function UpdatesPage() {
  const [log, setLog] = useState<LogLine[]>([]);
  const logId = useRef(0);
  const dl = useDownloader();
  const update = useUpdate({
    onLog: (line) =>
      setLog((prev) =>
        [...prev, { id: logId.current++, text: line }].slice(-200),
      ),
    onFinished: (ok, name) => {
      if (ok) {
        setLog([]);
        showToast("success", `${name} updated`);
      } else {
        showToast("error", `${name} update failed`);
      }
    },
  });

  const wasChecking = useRef(false);
  const manualCheck = useRef(false);
  useEffect(() => {
    if (wasChecking.current && !update.checking) {
      const wasManual = manualCheck.current;
      manualCheck.current = false;
      if (update.components.length > 0) {
        dismissToast(STATUS_KEY);
      } else if (update.checkError === "rate_limit") {
        showToast("warning", "GitHub rate limit reached — try again later.", {
          key: STATUS_KEY,
        });
      } else if (update.checkError === "error") {
        showToast("warning", "Update check failed — try again later.", {
          key: STATUS_KEY,
        });
      } else if (wasManual) {
        showToast("success", "Everything is up to date.", {
          key: STATUS_KEY,
        });
      }
    }
    wasChecking.current = update.checking;
  }, [update.checking, update.components.length, update.checkError]);

  return (
    <>
      <h1 className="mb-4 font-display text-[1.9rem] font-bold text-text">
        Updates
      </h1>

      <Callout label="// NOTE" className="mb-6 max-w-[600px]">
        Keeps the Launcher,{" "}
        <ExternalLink href="https://github.com/SteamRE/DepotDownloader">
          DepotDownloader
        </ExternalLink>
        , <ExternalLink href="https://www.7-zip.org/">7zip</ExternalLink> and{" "}
        <ExternalLink href="https://github.com/Xeralin/ThrowbackLoader">
          ThrowbackLoader
        </ExternalLink>{" "}
        up to date.
      </Callout>

      <div className="flex max-w-[600px] flex-col gap-4">
        {update.components.map((component, index) => (
          <div
            key={component.name}
            className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="min-w-0 truncate font-display text-[1.05rem] font-bold text-text">
                {component.name}
              </span>
              <Button
                variant="primary"
                className="flex-shrink-0"
                disabled={update.busy || dl.running}
                onClick={() => update.apply(index)}
              >
                Update &gt; {component.target}
              </Button>
            </div>
            {component.notes.length > 0 && (
              <ul className="mt-3 list-disc space-y-0.5 pl-4 text-ui text-text-muted">
                {groupNotes(component.notes).map((note, noteIndex) => (
                  <li key={noteIndex}>
                    {renderNote(note.text)}
                    {note.children.length > 0 && (
                      <ul className="list-[circle] space-y-0.5 pl-4">
                        {note.children.map((child, childIndex) => (
                          <li key={childIndex}>{renderNote(child)}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {log.length > 0 && <LogBox lines={log} className="h-[180px]" />}

        <div>
          <Button
            variant="secondary"
            disabled={update.checking || update.busy}
            onClick={() => {
              manualCheck.current = true;
              update.check(true);
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
    </>
  );
}
