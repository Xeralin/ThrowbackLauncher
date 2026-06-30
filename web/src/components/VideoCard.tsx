import Image from "next/image";
import { Tag } from "./Tag";
import { ExternalLink } from "./ExternalLink";
import { DownloaderButton } from "./DownloaderButton";
import type { VideoEntry } from "@/content/videos";

export function VideoGrid({ videos }: { videos: VideoEntry[] }) {
  return (
    <div className="video-grid mb-8 grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-5 max-[32.5em]:grid-cols-1">
      {videos.map((video) => (
        <VideoCard key={video.videoId} video={video} />
      ))}
    </div>
  );
}

function VideoCard({ video }: { video: VideoEntry }) {
  const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  const thumbUrl = `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;

  return (
    <div className="video-card group card-lift overflow-hidden">
      <ExternalLink
        href={watchUrl}
        className="relative block aspect-video overflow-hidden bg-surface-2"
      >
        <Image
          src={thumbUrl}
          alt={video.title}
          fill
          sizes="(max-width: 520px) 100vw, 320px"
          className="object-cover transition-transform duration-300 group-hover:[transform:scale(1.03)]"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-brand after:ml-[3px] after:block after:h-0 after:w-0 after:[border-color:transparent_transparent_transparent_#fff] after:[border-style:solid] after:[border-width:9px_0_9px_18px] after:content-['']" />
        </div>
      </ExternalLink>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-[1.1rem]">
        <div className="mb-[0.65rem] flex flex-wrap gap-[0.4rem]">
          {video.tags.map((tag) => (
            <Tag key={tag.label} variant={tag.variant}>
              {tag.label}
            </Tag>
          ))}
        </div>
        <h3 className="mb-[0.3rem] font-display text-[1.1rem] font-bold leading-[1.3] text-text">
          {video.title}
        </h3>
        <div className="mb-[0.65rem] font-mono text-[0.63rem] tracking-[0.08em] text-text-muted">
          BY {video.by}
        </div>
        <p className="mb-4 flex-1 text-[0.85rem] leading-[1.6] text-text-muted">
          {video.description}
        </p>
        <DownloaderButton href={watchUrl}>→ Watch on YouTube</DownloaderButton>
      </div>
    </div>
  );
}
