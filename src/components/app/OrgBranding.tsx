"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { uploadOrgLogo, removeOrgLogo } from "@/lib/supabase/orgBrandingActions";
import { useDictionary } from "@/i18n/LocaleProvider";

export function OrgBranding({ logoUrl, isOwner }: { logoUrl: string | null; isOwner: boolean }) {
  const { orgBranding: t } = useDictionary().auth;
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(logoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadOrgLogo(fd);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? t.uploadError);
      return;
    }
    setPreview(res.logoUrl ? `${res.logoUrl}?t=${Date.now()}` : null);
  };

  const handleRemove = async () => {
    setBusy(true);
    setError(null);
    const res = await removeOrgLogo();
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? t.removeError);
      return;
    }
    setPreview(null);
  };

  return (
    <div>
      <p className="text-[11.5px] text-ink-faint mb-3.5 leading-relaxed max-w-[540px]">{t.description}</p>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg border border-line bg-surface flex items-center justify-center shrink-0 overflow-hidden">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={t.logoAlt} className="w-full h-full object-contain" />
          ) : (
            <ImageIcon size={20} className="text-ink-faint" />
          )}
        </div>

        {isOwner ? (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-accent hover:underline disabled:opacity-60"
              >
                {busy ? <Loader2 size={13} className="animate-spin-slow" /> : <Upload size={13} />}
                {preview ? t.replaceLogo : t.uploadLogo}
              </button>
              {preview && (
                <button
                  onClick={handleRemove}
                  disabled={busy}
                  className="flex items-center gap-1.5 text-[12.5px] text-ink-faint hover:text-coral transition-colors disabled:opacity-60"
                >
                  <Trash2 size={13} /> {t.remove}
                </button>
              )}
            </div>
            {error && <div className="text-[11.5px] text-coral mt-2">{error}</div>}
          </div>
        ) : (
          <p className="text-[12px] text-ink-faint">{t.ownerOnly}</p>
        )}
      </div>
    </div>
  );
}
