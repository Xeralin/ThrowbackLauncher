export function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center"
    >
      <span
        className={`relative h-[22px] w-[44px] flex-shrink-0 rounded-md border transition-colors duration-200 ${
          checked
            ? "border-brand bg-brand group-hover:bg-[#a01020]"
            : "border-border bg-surface-2 group-hover:bg-border"
        }`}
      >
        <span
          className={`absolute left-[3px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.45)] transition-all duration-200 ease-out group-active:w-[18px] ${
            checked
              ? "translate-x-[22px] bg-white group-active:translate-x-[18px]"
              : "translate-x-0 bg-text-muted group-hover:bg-text"
          }`}
        />
      </span>
    </button>
  );
}
