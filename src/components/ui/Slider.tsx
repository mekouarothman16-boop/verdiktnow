export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = "%",
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="flex justify-between mb-2">
        <span className="text-[12.5px] text-ink-soft">{label}</span>
        <span className="font-mono text-[13px] text-accent-deep font-semibold">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </label>
  );
}
