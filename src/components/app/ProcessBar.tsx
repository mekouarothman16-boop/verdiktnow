"use client";

import { useState } from "react";
import { Tag as TagIcon, X } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useDictionary } from "@/i18n/LocaleProvider";

export function ProcessBar({
  processName,
  setProcessName,
  tags,
  onAddTag,
  onRemoveTag,
  readOnly = false,
}: {
  processName: string;
  setProcessName: (v: string) => void;
  tags?: string[];
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  readOnly?: boolean;
}) {
  const { processBar: t } = useDictionary().tool;
  const [tagInput, setTagInput] = useState("");

  const submitTag = () => {
    const v = tagInput.trim();
    if (v && onAddTag) onAddTag(v);
    setTagInput("");
  };

  return (
    <div className="no-print border-b border-line bg-surface">
      <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-3 flex items-center gap-3.5 flex-wrap">
        <Eyebrow>{t.evaluatedProcessLabel}</Eyebrow>
        <input
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
          disabled={readOnly}
          className="flex-1 min-w-[220px] border border-line rounded-[12px] px-3 py-2 font-sans text-[15px] font-semibold text-ink outline-none bg-bg focus:border-accent transition-colors disabled:text-ink-faint disabled:cursor-not-allowed"
        />
        {((tags ?? []).length > 0 || onAddTag) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <TagIcon size={13} className="text-ink-faint shrink-0" />
            {(tags ?? []).map((tag) =>
              onAddTag ? (
                <span key={tag} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-accent-soft text-accent-deep text-[11.5px] font-medium">
                  {tag}
                  <button
                    onClick={() => onRemoveTag?.(tag)}
                    aria-label={t.removeTagAriaLabel.replace("{tag}", tag)}
                    className="hover:text-coral transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ) : (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-line-soft text-ink-soft text-[11.5px] font-medium">
                  {tag}
                </span>
              )
            )}
            {onAddTag && (
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    submitTag();
                  }
                }}
                onBlur={submitTag}
                placeholder={t.addTagPlaceholder}
                className="w-[150px] border border-line rounded-full px-2.5 py-1 text-[11.5px] text-ink outline-none bg-bg focus:border-accent transition-colors"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
