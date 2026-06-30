import Image from "next/image";
import { withBasePath } from "@/lib/asset";

type ContentImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export function ContentImage({ src, alt, width, height }: ContentImageProps) {
  return (
    <Image src={withBasePath(src)} alt={alt} width={width} height={height} />
  );
}
