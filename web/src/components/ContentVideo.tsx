"use client";

import { useEffect, useRef } from "react";

type ContentVideoProps = {
  src: string;
  width: number;
  height: number;
  label: string;
};

export function ContentVideo({ src, width, height, label }: ContentVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        video.play().catch(() => undefined);
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      width={width}
      height={height}
      aria-label={label}
      preload="metadata"
      loop
      muted
      playsInline
    >
      <source src={src} type="video/webm" />
    </video>
  );
}
