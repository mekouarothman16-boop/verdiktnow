"use client";

import { useEffect, useState, useTransition } from "react";
import { Save, Trash2 } from "lucide-react";
import { listWeightProfiles, saveWeightProfile, deleteWeightProfile, type WeightProfileEntry } from "@/lib/supabase/weightProfileActions";
import { getProcessCategories, type Weights } from "@/lib/scoring";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

export function WeightProfiles({
  weights,
  setWeights,
  category,
  loggedIn,
}: {
  weights: Weights;
  setWeights: (w: Weights) => void;
  category?: string;
  loggedIn: boolean;
}) {
  const locale = useLocale();
  const { weightProfiles: t } = useDictionary().tool;
  const processCategories = getProcessCategories(locale);
  const [profiles, setProfiles] = useState<WeightProfileEntry[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!loggedIn) return;
    listWeightProfiles().then(setProfiles);
  }, [loggedIn]);

  if (!loggedIn) return null;

  const apply = (p: WeightProfileEntry) => setWeights(p.weights);

  const save = () => {
    const name = nameInput.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await saveWeightProfile(name, category || null, weights);
      if (res.ok) {
        setProfiles((prev) => [{ id: res.id, name, category: category || null, weights, created_at: res.createdAt }, ...prev]);
        setNameInput("");
        setShowSaveForm(false);
      }
    });
  };

  const remove = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    deleteWeightProfile(id);
  };

  return (
    <div className="mt-4 pt-4 border-t border-line-soft">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11.5px] font-semibold text-ink-soft">{t.eyebrow}</span>
        {!showSaveForm && (
          <button
            onClick={() => setShowSaveForm(true)}
            className="text-[11px] text-accent hover:underline flex items-center gap-1"
          >
            <Save size={12} /> {t.saveThisProfile}
          </button>
        )}
      </div>
      {showSaveForm && (
        <div className="flex items-center gap-2 mb-3">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder={t.namePlaceholder}
            className="flex-1 border border-line rounded-[12px] px-2.5 py-1.5 text-[12px] text-ink outline-none bg-surface focus:border-accent transition-colors"
            autoFocus
          />
          <button
            onClick={save}
            disabled={pending || !nameInput.trim()}
            className="px-2.5 py-1.5 rounded-full bg-accent-vivid text-ink text-[11.5px] font-semibold disabled:opacity-60"
          >
            {t.saveButton}
          </button>
          <button
            onClick={() => {
              setShowSaveForm(false);
              setNameInput("");
            }}
            className="text-[11px] text-ink-faint hover:text-ink"
          >
            {t.cancelButton}
          </button>
        </div>
      )}
      {profiles.length === 0 ? (
        <p className="text-[11.5px] text-ink-faint">{t.noProfiles}</p>
      ) : (
        <div className="grid gap-1.5">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-line hover:border-accent transition-colors">
              <button onClick={() => apply(p)} className="flex-1 text-left text-[12px] text-ink font-medium">
                {p.name}
                {p.category && (
                  <span className="text-ink-faint font-normal">
                    {" · "}
                    {processCategories.find((c) => c.id === p.category)?.label ?? p.category}
                  </span>
                )}
              </button>
              <button
                onClick={() => remove(p.id)}
                aria-label={t.deleteProfileAriaLabel.replace("{name}", p.name)}
                className="text-ink-faint hover:text-coral transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
