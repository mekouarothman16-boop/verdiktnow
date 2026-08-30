"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, X } from "lucide-react";
import type { OrgRole } from "@/lib/supabase/types";
import { formatSeatPrice, getViewerSeat, VIEWER_SEAT_PRICE_MONTHLY } from "@/lib/plans";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

export type MemberEntry = { userId: string; email: string; role: OrgRole };
export type InviteEntry = { id: string; email: string };

export function OrgMembers({
  members,
  invites,
  isOwner,
  currentUserId,
}: {
  members: MemberEntry[];
  invites: InviteEntry[];
  isOwner: boolean;
  currentUserId: string;
}) {
  const locale = useLocale();
  const viewerSeat = getViewerSeat(locale);
  const { orgMembers: t } = useDictionary().auth;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "viewer">("member");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/organization/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.inviteError);
      setSuccess(t.inviteSentSuccess.replace("{email}", email));
      setEmail("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.inviteError);
    } finally {
      setInviting(false);
    }
  };

  const remove = async (userId: string) => {
    setRemovingId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/organization/members/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.removeError);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.removeError);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <div className="grid gap-px bg-line border border-line rounded-[10px] overflow-hidden">
        {members.map((m) => (
          <div key={m.userId} className="bg-surface px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] text-ink">{m.email}{m.userId === currentUserId && <span className="text-ink-faint"> {t.you}</span>}</div>
              <div className="font-mono text-[10px] text-ink-faint uppercase tracking-wide mt-0.5">
                {m.role === "owner" ? t.roleOwner : m.role === "viewer" ? t.roleViewer : t.roleMember}
              </div>
            </div>
            {isOwner && m.userId !== currentUserId && (
              <button
                onClick={() => remove(m.userId)}
                disabled={removingId === m.userId}
                aria-label={t.removeAria.replace("{email}", m.email)}
                className="text-ink-faint hover:text-coral transition-colors p-1 disabled:opacity-50"
              >
                {removingId === m.userId ? <Loader2 size={14} className="animate-spin-slow" /> : <X size={14} />}
              </button>
            )}
          </div>
        ))}
        {invites.map((inv) => (
          <div key={inv.id} className="bg-surface px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] text-ink-soft">{inv.email}</div>
              <div className="font-mono text-[10px] text-amber uppercase tracking-wide mt-0.5">{t.pendingInvite}</div>
            </div>
          </div>
        ))}
      </div>

      {isOwner && (
        <>
          <form onSubmit={invite} className="flex items-center gap-2.5 mt-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="flex-1 border border-line rounded-lg px-3 py-2.5 font-sans text-[13.5px] text-ink outline-none bg-surface focus:border-accent transition-colors"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "member" | "viewer")}
              title={t.roleSelectTitle}
              className="border border-line rounded-lg px-2.5 py-2.5 font-sans text-[13px] text-ink-soft outline-none bg-surface focus:border-accent transition-colors cursor-pointer"
            >
              <option value="member">{t.roleMember}</option>
              <option value="viewer">{t.viewerOption}</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-vivid text-ink text-[13.5px] font-semibold hover:brightness-95 transition disabled:opacity-60"
            >
              {inviting ? <Loader2 size={14} className="animate-spin-slow" /> : <UserPlus size={14} />}
              {t.invite}
            </button>
          </form>
          {inviteRole === "viewer" && (
            <p className="text-[11.5px] text-ink-faint mt-2">
              {viewerSeat.inviteHint.replace("{price}", formatSeatPrice(VIEWER_SEAT_PRICE_MONTHLY, "monthly", locale, viewerSeat.unitLabel))}
            </p>
          )}
        </>
      )}
      {error && <div className="text-[12.5px] text-coral mt-3">{error}</div>}
      {success && <div className="text-[12.5px] text-teal mt-3">{success}</div>}
    </div>
  );
}
