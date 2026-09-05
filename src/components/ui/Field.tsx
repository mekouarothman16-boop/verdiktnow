import { FieldHint } from "@/components/ui/FieldHint";

export function Field({
  label,
  unit,
  value,
  onChange,
  step = 1,
  disabled = false,
  hint,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] text-ink-soft mb-1.5 flex items-center gap-1">
        {label}
        {hint && <FieldHint text={hint} />}
      </span>
      <div className="flex items-center border border-line rounded-[12px] overflow-hidden bg-surface transition-colors focus-within:border-accent">
        <input
          type="number"
          value={value}
          step={step}
          min={0}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
          className="flex-1 border-none outline-none px-[11px] py-2.5 font-mono text-sm text-ink w-full bg-transparent disabled:text-ink-faint disabled:cursor-not-allowed"
        />
        {unit && (
          <span className="px-[11px] font-mono text-xs text-ink-faint border-l border-line-soft whitespace-nowrap">
            {unit}
          </span>
        )}
      </div>
    </label>
  );
}
