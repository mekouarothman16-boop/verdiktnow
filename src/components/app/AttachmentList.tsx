"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, FileText, Image as ImageIcon, Trash2, Loader2, Upload, Link2 } from "lucide-react";
import { listAttachments, uploadAttachment, deleteAttachment, type AttachmentEntry } from "@/lib/supabase/attachmentActions";
import type { ProcessActivity } from "@/lib/scoring";
import { useDictionary } from "@/i18n/LocaleProvider";

function formatSize(bytes: number, t: ReturnType<typeof useDictionary>["tool"]["attachmentList"]): string {
  if (bytes < 1024) return t.sizeBytes.replace("{n}", String(bytes));
  if (bytes < 1024 * 1024) return t.sizeKb.replace("{n}", String(Math.round(bytes / 1024)));
  return t.sizeMb.replace("{n}", (bytes / (1024 * 1024)).toFixed(1));
}

export function AttachmentList({
  processId,
  readOnly = false,
  activities = [],
  links = {},
  onLinkChange,
}: {
  processId: string;
  readOnly?: boolean;
  activities?: ProcessActivity[];
  links?: Record<string, string>;
  onLinkChange?: (path: string, activityId: string) => void;
}) {
  const { attachmentList: t } = useDictionary().tool;
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<AttachmentEntry[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAttachments(processId).then(setAttachments);
  }, [processId]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadAttachment(processId, fd);
    setUploading(false);
    if (!res.ok) {
      setError(res.error ?? t.uploadFailed);
      return;
    }
    listAttachments(processId).then(setAttachments);
  };

  const handleDelete = (path: string) => {
    setAttachments((prev) => (prev ?? []).filter((a) => a.path !== path));
    deleteAttachment(processId, path);
    onLinkChange?.(path, "");
  };

  if (attachments === null) return null;

  return (
    <div className="mt-4.5 pt-4.5 border-t border-line-soft">
      <div className="flex items-center gap-2 mb-1.5">
        <Paperclip size={14} className="text-accent" />
        <span className="text-[12.5px] font-semibold text-ink-soft">{t.eyebrow}</span>
      </div>
      <p className="text-[11.5px] text-ink-faint mb-3 leading-relaxed max-w-[640px]">
        {t.description}
      </p>

      {attachments.length > 0 && (
        <div className="grid gap-1.5 mb-3">
          {attachments.map((a) => {
            const Icon = a.contentType.startsWith("image/") ? ImageIcon : FileText;
            const linkedId = activities.some((act) => act.id === links[a.path]) ? links[a.path] : "";
            const linkedActivity = activities.find((act) => act.id === linkedId);
            return (
              <div key={a.path} className="px-3 py-2 rounded-lg border border-line">
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className="text-ink-faint shrink-0" />
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 text-[12.5px] text-ink font-medium truncate hover:text-accent transition-colors"
                  >
                    {a.name}
                  </a>
                  <span className="text-[11px] text-ink-faint shrink-0 font-mono">{formatSize(a.size, t)}</span>
                  {!readOnly && (
                    <button
                      onClick={() => handleDelete(a.path)}
                      aria-label={t.deleteAriaLabel.replace("{name}", a.name)}
                      className="text-ink-faint hover:text-coral transition-colors p-0.5 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                {!readOnly && activities.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5 pl-[23px]">
                    <Link2 size={11} className="text-ink-faint shrink-0" />
                    <select
                      value={linkedId}
                      onChange={(e) => onLinkChange?.(a.path, e.target.value)}
                      className="text-[11px] text-ink-soft bg-transparent border border-line-soft rounded px-1.5 py-0.5 outline-none focus:border-accent transition-colors cursor-pointer"
                    >
                      <option value="">{t.linkToStepPlaceholder}</option>
                      {activities.map((act, i) => (
                        <option key={act.id} value={act.id}>
                          {i + 1}. {act.label || t.unnamedStep}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {readOnly && linkedActivity && (
                  <div className="flex items-center gap-1.5 mt-1.5 pl-[23px] text-[11px] text-ink-faint">
                    <Link2 size={11} className="shrink-0" />
                    {t.stepLabel} {linkedActivity.label || t.unnamedStep}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:underline disabled:opacity-60"
          >
            {uploading ? <Loader2 size={13} className="animate-spin-slow" /> : <Upload size={13} />}
            {uploading ? t.uploading : t.addAttachmentButton}
          </button>
          {error && <div className="text-[11.5px] text-coral mt-2">{error}</div>}
        </>
      )}
    </div>
  );
}
