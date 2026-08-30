"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { exportMyData, deleteMyAccount } from "@/lib/supabase/accountActions";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";
import { localizePath } from "@/i18n/localizePath";

export function DataControls({ userEmail }: { userEmail: string }) {
  const { dataControls: t } = useDictionary().auth;
  const router = useRouter();
  const locale = useLocale();
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportMyData();
      if (!res.ok) throw new Error(res.error);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `verdiktnow-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = () => {
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteMyAccount();
      if (res.ok) {
        router.push(`${localizePath("/", locale)}?compte_supprime=1`);
      } else {
        setDeleteError(res.error);
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 py-3 border-b border-line-soft">
        <div>
          <div className="text-[13.5px] font-semibold text-ink">{t.exportTitle}</div>
          <div className="text-[12px] text-ink-faint">{t.exportDesc}</div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-surface text-ink text-[13px] font-semibold hover:bg-accent-soft hover:border-accent/25 transition disabled:opacity-60"
        >
          {exporting ? <Loader2 size={14} className="animate-spin-slow" /> : <Download size={14} />}
          {t.exportBtn}
        </button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 py-3">
        <div>
          <div className="text-[13.5px] font-semibold text-ink">{t.deleteTitle}</div>
          <div className="text-[12px] text-ink-faint">{t.deleteDesc}</div>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-coral/25 bg-coral/5 text-coral text-[13px] font-semibold hover:bg-coral/10 transition"
        >
          <Trash2 size={14} />
          {t.deleteBtn}
        </button>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 flex items-center justify-center p-4"
          onClick={() => !pending && setConfirmOpen(false)}
        >
          <div
            className="bg-surface rounded-[12px] shadow-card max-w-[420px] w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-coral">
                <AlertTriangle size={16} />
                <h2 className="font-display text-[16px] font-bold">{t.modalTitle}</h2>
              </div>
              <button onClick={() => setConfirmOpen(false)} aria-label={t.closeAria} className="text-ink-faint hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <p className="text-[12.5px] text-ink-soft leading-relaxed mb-4">{t.modalWarning}</p>
            <label className="block mb-4">
              <span className="text-[12px] text-ink-soft block mb-1.5">
                {t.confirmLabel.split("{email}")[0]}
                <b>{userEmail}</b>
                {t.confirmLabel.split("{email}")[1]}
              </span>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-[13px] text-ink outline-none bg-bg focus:border-coral transition-colors"
                autoFocus
              />
            </label>
            {deleteError && <div className="text-[12.5px] text-coral mb-3">{deleteError}</div>}
            <button
              onClick={handleDelete}
              disabled={pending || confirmText.trim().toLowerCase() !== userEmail.toLowerCase()}
              className="w-full px-4 py-2.5 rounded-lg bg-coral text-white text-[13.5px] font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pending ? <Loader2 size={14} className="animate-spin-slow" /> : <Trash2 size={14} />}
              {t.confirmDeleteBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
