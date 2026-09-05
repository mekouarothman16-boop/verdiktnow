import { LocaleLink } from "@/components/i18n/LocaleLink";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Gauge } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ReactNode } from "react";

export function AuthCard({
  eyebrow,
  title,
  sub,
  error,
  message,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  error?: string;
  message?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-[400px]">
        <LocaleLink href="/" className="flex items-center gap-2.5 justify-center mb-5">
          <div className="w-9 h-9 rounded-[10px] bg-ink flex items-center justify-center">
            <Gauge size={17} color="var(--color-accent-soft)" />
          </div>
          <span className="font-display text-[16px] font-extrabold tracking-[0.01em] text-ink">VerdiktNow</span>
        </LocaleLink>
        <div className="flex justify-center mb-8">
          <LanguageSwitcher />
        </div>

        <Card className="p-7">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-[24px] font-semibold text-ink mt-2 mb-1.5 tracking-[0.005em]">{title}</h1>
          <p className="text-[13.5px] text-ink-soft leading-relaxed mb-6">{sub}</p>

          {error && (
            <div className="mb-5 px-3.5 py-3 rounded-[12px] bg-coral/10 border border-coral/20 text-[13px] text-coral">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-5 px-3.5 py-3 rounded-[12px] bg-teal/10 border border-teal/20 text-[13px] text-teal">
              {message}
            </div>
          )}

          {children}
        </Card>
        <div className="text-center mt-5 text-[13px] text-ink-soft">{footer}</div>
      </div>
    </div>
  );
}
