const SIZES = {
  md: {
    track: "h-[22px] w-[44px]",
    thumb: "h-[14px] w-[14px] left-[3px] rounded-[4px]",
    on: "translate-x-[22px] group-active:translate-x-[18px]",
    grow: "group-active:w-[18px]",
  },
  sm: {
    track: "h-[18px] w-[34px]",
    thumb: "h-[12px] w-[12px] left-[2px] rounded-[3px]",
    on: "translate-x-[16px] group-active:translate-x-[13px]",
    grow: "group-active:w-[15px]",
  },
};

export function Switch({
  checked,
  onChange,
  size = "md",
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  size?: "sm" | "md";
}) {
  const s = SIZES[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center"
    >
      <span
        className={`relative ${s.track} flex-shrink-0 rounded-md border transition-colors duration-200 ${
          checked
            ? "border-brand bg-brand group-hover:bg-[#a01020]"
            : "border-border bg-surface-2 group-hover:bg-border"
        }`}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 ${s.thumb} ${s.grow} shadow-[0_1px_2px_rgba(0,0,0,0.45)] transition-all duration-200 ease-out ${
            checked
              ? `bg-white ${s.on}`
              : "translate-x-0 bg-text-muted group-hover:bg-text"
          }`}
        />
      </span>
    </button>
  );
}
