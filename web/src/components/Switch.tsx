export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2.5"
    >
      <span
        className={`relative h-[20px] w-[36px] flex-shrink-0 rounded-full border transition-colors duration-200 ${
          checked ? "border-brand bg-brand" : "border-border bg-[#e8e0d5]"
        }`}
      >
        <span
          className={`absolute top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.45)] transition-all duration-200 ${
            checked ? "left-[18px]" : "left-[3px]"
          }`}
        />
      </span>
      {label && (
        <span
          className={`font-mono text-ui transition-colors ${
            checked ? "text-text" : "text-text-muted group-hover:text-text"
          }`}
        >
          {label}
        </span>
      )}
    </button>
  );
}
