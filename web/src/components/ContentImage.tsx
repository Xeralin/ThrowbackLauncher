import Image from "next/image";

type ContentImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export function ContentImage({
  src,
  alt,
  width,
  height,
  className,
}: ContentImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}
