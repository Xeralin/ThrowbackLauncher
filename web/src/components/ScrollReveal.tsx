"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR =
  ".card-grid .nav-card, .faq-list .question, .dev-card-row .dev-card";

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    let isFirstBatch = true;
    let firstBatchIndex = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        let batchDelay = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const delay = isFirstBatch ? firstBatchIndex++ * 80 : batchDelay;
          batchDelay += 60;
          window.setTimeout(
            () => el.setAttribute("data-inview", "true"),
            delay,
          );
          observer.unobserve(el);
        });
        isFirstBatch = false;
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );

    document.querySelectorAll(SELECTOR).forEach((el) => observer.observe(el));

    const added = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) observer.observe(node);
          node.querySelectorAll(SELECTOR).forEach((el) => observer.observe(el));
        });
      });
    });
    added.observe(document.body, { childList: true, subtree: true });

    return () => {
      added.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
