import { ToolShell } from "@/components/app/ToolShell";
import { createClient, getUserOrg, isSupabaseConfigured } from "@/lib/supabase/server";
import { getServerDictionary } from "@/i18n/getDictionary";

export default async function OutilPage() {
  const { tool } = await getServerDictionary();
  const initialName = tool.toolShell.defaultProcessName;
  if (!isSupabaseConfigured) return <ToolShell initialName={initialName} />;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const org = await getUserOrg(supabase, user?.id);
  return (
    <ToolShell
      initialName={initialName}
      loggedIn={!!user}
      plan={org?.plan ?? "free"}
      aiQuota={org?.aiQuota ?? null}
      aiUsedThisMonth={org?.aiUsedThisMonth ?? 0}
    />
  );
}
