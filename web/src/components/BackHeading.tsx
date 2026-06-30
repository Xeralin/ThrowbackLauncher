import Link from "next/link";

export function BackHeading({
  title,
  href = "/settings",
}: {
  title: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="group mb-6 flex w-fit items-center gap-2.5 no-underline"
    >
      <span className="text-[2.1rem] leading-none text-text-muted transition-colors group-hover:text-text">
        ‹
      </span>
      <h1 className="font-display text-[1.9rem] font-bold text-text">{title}</h1>
    </Link>
  );
}
