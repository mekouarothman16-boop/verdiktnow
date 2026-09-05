"use client";

import { useState } from "react";
import { Loader2, Settings } from "lucide-react";
import { useDictionary } from "@/i18n/LocaleProvider";

export function AccountActions() {
  const { accountActions: t } = useDictionary().auth;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || t.genericError);
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.genericError);
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={openPortal}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-vivid text-ink text-[13.5px] font-semibold hover:brightness-95 transition disabled:opacity-60"
      >
        {loading ? <Loader2 size={15} className="animate-spin-slow" /> : <Settings size={15} />}
        {t.manageSubscription}
      </button>
      {error && <div className="text-[12.5px] text-coral mt-3">{error}</div>}
    </div>
  );
}
