type ContentVideoProps = {
  src: string;
  width: number;
  height: number;
  label: string;
};

export function ContentVideo({ src, width, height, label }: ContentVideoProps) {
  return (
    <video
      width={width}
      height={height}
      aria-label={label}
      autoPlay
      loop
      muted
      playsInline
    >
      <source src={src} type="video/webm" />
    </video>
  );
}
