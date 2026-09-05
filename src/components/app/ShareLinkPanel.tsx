"use client";

import { useEffect, useState, useTransition } from "react";
import { Share2, Copy, Check, Trash2, X } from "lucide-react";
import { listShareLinks, createShareLink, revokeShareLink, type ShareLinkEntry } from "@/lib/supabase/shareActions";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";
import { localizePath } from "@/i18n/localizePath";

export function ShareLinkPanel({ processId }: { processId: string }) {
  const locale = useLocale();
  const { shareLinkPanel: t } = useDictionary().tool;
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<ShareLinkEntry[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open && links === null) {
      listShareLinks(processId).then(setLinks);
    }
  }, [open, links, processId]);

  const activeLinks = (links ?? []).filter((l) => !l.revoked_at);

  const create = () => {
    startTransition(async () => {
      const res = await createShareLink(processId);
      if (res.ok) setLinks((prev) => [res.link, ...(prev ?? [])]);
    });
  };

  const revoke = (linkId: string) => {
    setLinks((prev) => (prev ?? []).map((l) => (l.id === linkId ? { ...l, revoked_at: new Date().toISOString() } : l)));
    revokeShareLink(processId, linkId);
  };

  const copy = (link: ShareLinkEntry) => {
    const url = `${window.location.origin}${localizePath(`/partage/${link.token}`, locale)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(link.id);
      setTimeout(() => setCopiedId((c) => (c === link.id ? null : c)), 2000);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2.5 rounded-full border border-line bg-surface text-ink text-[13.5px] font-semibold hover:bg-accent-soft hover:border-accent/25 transition flex items-center gap-2"
      >
        <Share2 size={14} /> {t.shareButton}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-[340px] bg-surface border border-line rounded-[10px] shadow-card p-4 z-30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12.5px] font-semibold text-ink">{t.panelTitle}</span>
            <button onClick={() => setOpen(false)} aria-label={t.closeAriaLabel} className="text-ink-faint hover:text-ink">
              <X size={14} />
            </button>
          </div>
          <p className="text-[11.5px] text-ink-faint leading-relaxed mb-3">
            {t.description}
          </p>
          {activeLinks.length > 0 && (
            <div className="grid gap-2 mb-3">
              {activeLinks.map((l) => (
                <div key={l.id} className="flex items-center gap-2 px-2.5 py-2 rounded-[12px] border border-line">
                  <span className="flex-1 text-[11px] font-mono text-ink-soft truncate">
                    /partage/{l.token.slice(0, 8)}…
                  </span>
                  <button onClick={() => copy(l)} aria-label={t.copyAriaLabel} className="text-ink-faint hover:text-accent transition-colors">
                    {copiedId === l.id ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
                  </button>
                  <button onClick={() => revoke(l.id)} aria-label={t.revokeAriaLabel} className="text-ink-faint hover:text-coral transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={create}
            disabled={pending}
            className="w-full px-3 py-2 rounded-full bg-accent-vivid text-ink text-[12.5px] font-semibold hover:brightness-95 transition disabled:opacity-60"
          >
            {t.createButton}
          </button>
        </div>
      )}
    </div>
  );
}
