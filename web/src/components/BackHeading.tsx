export function BackHeading({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Back"
      className="group mb-4 flex w-fit items-center gap-2.5"
    >
      <span className="text-[2.1rem] leading-none text-text-muted transition-colors group-hover:text-text">
        ‹
      </span>
      <h1 className="font-display text-[1.9rem] font-bold text-text">
        {title}
      </h1>
    </button>
  );
}
