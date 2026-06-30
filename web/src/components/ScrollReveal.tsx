"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR =
  ".card-grid .nav-card, .server-grid .server-card, .video-grid .video-card, " +
  ".faq-list .question, .downloader-card, .dev-card-row .dev-card";

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

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
