"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, AlertTriangle, Check } from "lucide-react";
import { bulkImportProcesses } from "@/lib/supabase/processActions";
import { getProcessCategories, type Currency } from "@/lib/scoring";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

type ParsedRow = { name: string; category?: string; tags?: string[]; currency?: Currency };

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const clean = text.replace(/^﻿/, "");
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function matchCategory(input: string, categories: { id: string; label: string }[]): string | undefined {
  const norm = input.trim().toLowerCase();
  if (!norm) return undefined;
  const byId = categories.find((c) => c.id.toLowerCase() === norm);
  if (byId) return byId.id;
  return categories.find((c) => c.label.toLowerCase() === norm)?.id;
}

export function ImportCsvButton() {
  const locale = useLocale();
  const { importCsvButton: t } = useDictionary().tool;
  const categories = getProcessCategories(locale);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setResult(null);
    const text = await file.text();
    const table = parseCsv(text);
    if (table.length === 0) {
      setRows([]);
      return;
    }
    const header = table[0].map((h) => h.trim().toLowerCase());
    const nameIdx = header.findIndex((h) => ["nom", "name"].includes(h));
    const catIdx = header.findIndex((h) => ["catégorie", "categorie", "category"].includes(h));
    const tagsIdx = header.findIndex((h) => ["étiquettes", "etiquettes", "tags"].includes(h));
    const curIdx = header.findIndex((h) => ["devise", "currency"].includes(h));

    if (nameIdx === -1) {
      setRows([]);
      setResult({ created: 0, errors: [t.missingNameColumn] });
      return;
    }

    const parsed: ParsedRow[] = table
      .slice(1)
      .map((r) => {
        const name = (r[nameIdx] || "").trim();
        const category = catIdx >= 0 ? matchCategory(r[catIdx] || "", categories) : undefined;
        const tags = tagsIdx >= 0 ? (r[tagsIdx] || "").split(";").map((t) => t.trim()).filter(Boolean) : undefined;
        const curRaw = curIdx >= 0 ? (r[curIdx] || "").trim().toUpperCase() : "";
        const currency: Currency | undefined = curRaw === "USD" ? "USD" : curRaw === "CAD" ? "CAD" : undefined;
        return { name, category, tags, currency };
      })
      .filter((r) => r.name.length > 0)
      .slice(0, 200);

    setRows(parsed);
  };

  const confirmImport = () => {
    setImporting(true);
    bulkImportProcesses(rows).then((res) => {
      setImporting(false);
      setResult(res);
      if (res.created > 0) setRows([]);
    });
  };

  const close = () => {
    setOpen(false);
    setRows([]);
    setResult(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4.5 py-2.5 rounded-full border border-line bg-surface text-ink text-[13.5px] font-semibold hover:bg-accent-soft hover:border-accent/25 transition"
      >
        <Upload size={16} /> {t.buttonLabel}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 bg-ink/40 flex items-center justify-center p-4" onClick={close}>
          <div
            className="bg-surface rounded-[12px] shadow-card max-w-[560px] w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-[18px] font-semibold text-ink">{t.dialogTitle}</h2>
              <button onClick={close} aria-label={t.closeAriaLabel} className="text-ink-faint hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <p className="text-[12.5px] text-ink-soft leading-relaxed mb-4">
              {t.instructions
                .split(/(\{name\}|\{category\}|\{tags\}|\{currency\})/)
                .map((part, i) =>
                  part === "{name}" ? <b key={i}>{t.instructionsName}</b> :
                  part === "{category}" ? <b key={i}>{t.instructionsCategory}</b> :
                  part === "{tags}" ? <b key={i}>{t.instructionsTags}</b> :
                  part === "{currency}" ? <b key={i}>{t.instructionsCurrency}</b> :
                  <span key={i}>{part}</span>
                )}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="text-[12.5px] mb-4"
            />
            {rows.length > 0 && (
              <>
                <div className="text-[12px] text-ink-soft mb-2">
                  {t.detectedCount.replace("{n}", String(rows.length)).replace("{fileName}", fileName)}
                </div>
                <div className="border border-line rounded-[12px] overflow-hidden mb-4 max-h-[220px] overflow-y-auto">
                  <table className="w-full text-[12px]">
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i} className="border-b border-line-soft last:border-0">
                          <td className="px-3 py-1.5 text-ink">{r.name}</td>
                          <td className="px-3 py-1.5 text-ink-faint">
                            {r.category ? categories.find((c) => c.id === r.category)?.label : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-ink-faint">{r.currency ?? "CAD"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={confirmImport}
                  disabled={importing}
                  className="w-full px-4 py-2.5 rounded-full bg-accent-vivid text-ink text-[13.5px] font-semibold hover:brightness-95 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {importing ? <Loader2 size={14} className="animate-spin-slow" /> : <Upload size={14} />}
                  {importing ? t.importing : t.importButton.replace("{n}", String(rows.length))}
                </button>
              </>
            )}
            {result && (
              <div
                className={`mt-4 p-3 rounded-[12px] text-[12.5px] flex items-start gap-2 ${
                  result.created === 0 && result.errors.length > 0 ? "bg-coral/10 text-coral" : "bg-accent-soft text-accent-deep"
                }`}
              >
                {result.created > 0 ? <Check size={14} className="shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
                <div>
                  {result.created > 0 && (
                    <div>
                      {(result.created > 1 ? t.importedSuccessPlural : t.importedSuccessSingular).replace("{n}", String(result.created))}
                    </div>
                  )}
                  {result.errors.length > 0 && (
                    <div className="mt-1">
                      {result.errors.slice(0, 5).map((e, i) => (
                        <div key={i}>{e}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
