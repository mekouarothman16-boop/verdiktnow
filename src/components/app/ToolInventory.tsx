"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2, Wrench } from "lucide-react";
import {
  buildToolInventory, getToolCatalog, getToolRoleMeta, parseCustomTools, parseSelectedTools,
  serializeCustomTools, serializeSelectedTools, TOOL_ROLE_ORDER, type Context, type CustomTool, type ToolRole,
} from "@/lib/scoring";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

let seq = 0;
const newId = () => `tool-${Date.now()}-${seq++}`;

/** Chaque rôle a sa couleur, pour que la lecture « levier ou obstacle ? » se fasse d'un coup d'œil
 * sans avoir à relire les libellés : accent = moteur déjà en place, corail = frein. */
const ROLE_PILL: Record<ToolRole | "unknown", string> = {
  platform: "border-accent bg-accent-soft text-accent-deep",
  connected: "border-teal/40 bg-surface text-teal",
  data: "border-gold-tint/50 bg-gold-soft text-gold",
  manual: "border-coral/40 bg-surface text-coral",
  unknown: "border-line bg-line-soft text-ink-faint",
};

export function ToolInventory({
  context,
  setContext,
  readOnly = false,
}: {
  context: Context;
  setContext: (fn: (prev: Context) => Context) => void;
  readOnly?: boolean;
}) {
  const locale = useLocale();
  const { toolInventory: t } = useDictionary().tool;
  const catalog = getToolCatalog(locale);
  const roleMeta = getToolRoleMeta(locale);
  const selected = parseSelectedTools(context);
  const customTools = parseCustomTools(context);
  const inventory = buildToolInventory(context, locale);
  const [open, setOpen] = useState(selected.length > 0 || customTools.length > 0);

  // La sélection est recalculée depuis l'état précédent, jamais depuis la valeur du rendu courant :
  // deux bascules dans le même cycle React écraseraient autrement la première.
  const toggleTool = (id: string) => {
    setContext((p) => {
      const prev = parseSelectedTools(p);
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      return { ...p, toolsSelected: serializeSelectedTools(next) };
    });
  };
  const setCustom = (fn: (prev: CustomTool[]) => CustomTool[]) =>
    setContext((p) => ({ ...p, toolsCustom: serializeCustomTools(fn(parseCustomTools(p))) }));
  const updateCustom = (id: string, patch: Partial<CustomTool>) =>
    setCustom((prev) => prev.map((tool) => (tool.id === id ? { ...tool, ...patch } : tool)));
  const addCustom = () => {
    setCustom((prev) => [...prev, { id: newId(), name: "", usage: "", role: "unknown" }]);
    setOpen(true);
  };
  const removeCustom = (id: string) => setCustom((prev) => prev.filter((tool) => tool.id !== id));

  /** Les rôles réellement présents, dans l'ordre levier → obstacle. */
  const presentRoles = [...TOOL_ROLE_ORDER, "unknown" as const].filter((role) =>
    inventory.entries.some((e) => e.role === role)
  );

  return (
    <div className="mt-4.5 pt-4.5 border-t border-line-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-soft hover:text-ink transition-colors"
      >
        <Wrench size={14} className="text-accent" />
        {t.toggleLabel}
        {inventory.entries.length > 0 && (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent-soft text-accent-deep">
            {inventory.entries.length}
          </span>
        )}
        <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      <p className="text-[11.5px] text-ink-faint mt-1.5 leading-relaxed max-w-[640px]">{t.description}</p>

      {open && (
        <div className="mt-3.5">
          {catalog.map((group) => (
            <div key={group.id} className="mb-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-faint mb-1.5">
                {group.label}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.tools.map((tool) => {
                  const on = selected.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => !readOnly && toggleTool(tool.id)}
                      disabled={readOnly}
                      title={roleMeta[tool.role].description}
                      className={
                        on
                          ? "px-2.5 py-1 rounded-full border border-accent bg-accent-soft text-accent-deep text-[11.5px] font-medium transition-colors disabled:cursor-not-allowed"
                          : "px-2.5 py-1 rounded-full border border-line text-ink-soft text-[11.5px] font-medium hover:border-accent hover:text-accent transition-colors disabled:cursor-not-allowed"
                      }
                    >
                      {tool.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-4 pt-3.5 border-t border-line-soft">
            <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-faint mb-1">
              {t.customTitle}
            </div>
            <p className="text-[11.5px] text-ink-faint mb-2.5 leading-relaxed max-w-[640px]">{t.customDescription}</p>
            {customTools.length > 0 && (
              <div className="grid gap-1.5 mb-2.5">
                {customTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_minmax(0,190px)_auto] gap-1.5 items-center"
                  >
                    <input
                      value={tool.name}
                      onChange={(e) => updateCustom(tool.id, { name: e.target.value })}
                      placeholder={t.customNamePlaceholder}
                      disabled={readOnly}
                      className="border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink outline-none bg-surface focus:border-accent transition-colors disabled:text-ink-faint"
                    />
                    <input
                      value={tool.usage}
                      onChange={(e) => updateCustom(tool.id, { usage: e.target.value })}
                      placeholder={t.customUsagePlaceholder}
                      disabled={readOnly}
                      className="border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink outline-none bg-surface focus:border-accent transition-colors disabled:text-ink-faint"
                    />
                    <select
                      value={tool.role}
                      onChange={(e) => updateCustom(tool.id, { role: e.target.value as CustomTool["role"] })}
                      disabled={readOnly}
                      title={roleMeta[tool.role].description}
                      className="border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink outline-none bg-surface focus:border-accent transition-colors cursor-pointer disabled:text-ink-faint disabled:cursor-not-allowed"
                    >
                      <option value="unknown">{t.roleOptionUnknown}</option>
                      <option value="platform">{t.roleOptionPlatform}</option>
                      <option value="connected">{t.roleOptionConnected}</option>
                      <option value="data">{t.roleOptionData}</option>
                      <option value="manual">{t.roleOptionManual}</option>
                    </select>
                    {!readOnly && (
                      <button
                        onClick={() => removeCustom(tool.id)}
                        aria-label={t.removeToolAriaLabel}
                        className="text-ink-faint hover:text-coral transition-colors p-1 justify-self-end w-fit"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!readOnly && (
              <button
                onClick={addCustom}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:underline"
              >
                <Plus size={13} /> {t.addToolButton}
              </button>
            )}
          </div>

          {inventory.entries.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-line-soft">
              <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-faint mb-2.5">
                {t.readingTitle}
              </div>
              {presentRoles.map((role) => (
                <div key={role} className="mb-3 last:mb-0">
                  <div className="flex items-center flex-wrap gap-1.5 mb-1">
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${ROLE_PILL[role]}`}
                    >
                      {roleMeta[role].tag}
                    </span>
                    {inventory.entries
                      .filter((e) => e.role === role)
                      .map((e, i, arr) => (
                        <span key={`${e.id}-${e.label}`} className="text-[12px] text-ink">
                          {e.label}
                          {e.usage && <span className="text-ink-faint"> ({e.usage})</span>}
                          {i < arr.length - 1 && <span className="text-ink-faint">,</span>}
                        </span>
                      ))}
                  </div>
                  <p className="text-[11.5px] text-ink-soft leading-relaxed max-w-[640px]">
                    {roleMeta[role].description}
                  </p>
                </div>
              ))}
              {inventory.verdict && (
                <p className="mt-3 p-3 rounded-lg bg-accent-soft/60 border border-accent/15 text-[12.5px] text-ink leading-relaxed">
                  {inventory.verdict}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
