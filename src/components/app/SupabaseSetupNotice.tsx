"use client";

import { LocaleLink } from "@/components/i18n/LocaleLink";
import { DatabaseZap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useDictionary } from "@/i18n/LocaleProvider";

export function SupabaseSetupNotice() {
  const { supabaseSetupNotice: t } = useDictionary().tool;
  return (
    <div className="flex-1 flex items-center justify-center px-5 py-16">
      <Card className="p-8 max-w-[440px] text-center">
        <div className="w-11 h-11 rounded-[10px] bg-accent-soft flex items-center justify-center mx-auto mb-4">
          <DatabaseZap size={20} className="text-accent-deep" />
        </div>
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h1 className="font-sans text-[18px] font-semibold text-ink mt-2 mb-2.5">{t.title}</h1>
        <p className="text-[13.5px] text-ink-soft leading-relaxed mb-6">
          {t.description
            .split(/(\{url\}|\{key\}|\{envFile\}|\{envExample\})/)
            .map((part, i) =>
              part === "{url}" ? <code key={i} className="font-mono text-[12px] bg-line-soft px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> :
              part === "{key}" ? <code key={i} className="font-mono text-[12px] bg-line-soft px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> :
              part === "{envFile}" ? <code key={i} className="font-mono text-[12px] bg-line-soft px-1 py-0.5 rounded">.env.local</code> :
              part === "{envExample}" ? <code key={i} className="font-mono text-[12px] bg-line-soft px-1 py-0.5 rounded">.env.local.example</code> :
              <span key={i}>{part}</span>
            )}
        </p>
        <LocaleLink href="/outil" className="text-accent font-semibold text-[13.5px] hover:underline">
          {t.useWithoutAccount}
        </LocaleLink>
      </Card>
    </div>
  );
}
