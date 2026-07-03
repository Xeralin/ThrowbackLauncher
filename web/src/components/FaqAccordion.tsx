"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export type FaqItem = { q: string; a: ReactNode };

function Chevron() {
  return (
    <svg
      className="question-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Item({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false);
  const answerId = `faq-${index}-answer`;
  const slug = slugify(item.q);

  useEffect(() => {
    function openFromHash() {
      if (decodeURIComponent(window.location.hash.slice(1)) !== slug) return;
      setOpen(true);
      requestAnimationFrame(() =>
        document.getElementById(slug)?.scrollIntoView({ block: "start" }),
      );
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [slug]);

  return (
    <div id={slug} className={open ? "question open" : "question"}>
      <button
        type="button"
        className="question-header"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="question-title">{item.q}</span>
        <Chevron />
      </button>
      <div id={answerId} className="answer" inert={!open ? true : undefined}>
        <div className="answer-clip">
          <div className="answer-inner">{item.a}</div>
        </div>
      </div>
    </div>
  );
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="faq-list">
      {items.map((item, index) => (
        <Item key={item.q} item={item} index={index} />
      ))}
    </div>
  );
}
