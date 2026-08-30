import "server-only";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured, priceIdForTier, viewerSeatPriceId, isViewerSeatBillingConfigured } from "@/lib/stripe";
import { isSelfServeTier, isBillingPeriod, type BillingPeriod } from "@/lib/plans";

/**
 * Tous les forfaits payants sont facturés à la personne, pas en montant fixe par organisation
 * (le prix par siège baisse à Croissance par rapport à Essentiel — un tarif volume, pas une
 * organisation moins chère). Le rôle "Spectateur" (viewer) est un siège à part, moins cher,
 * ajouté à la même organisation plutôt qu'une organisation distincte (voir plans.ts).
 *
 * Comme l'acceptation d'une invitation se fait par un déclencheur Postgres (handle_new_user,
 * 0003_organizations.sql), jamais par une route Next.js, il n'y a pas de point d'accroche
 * applicatif au moment exact où un siège devient réel. Plutôt que d'ajouter une infrastructure
 * de webhook Supabase, cette fonction réconcilie le nombre réel de sièges (éditeurs et
 * spectateurs) avec ce qui est facturé dans Stripe — appelée à chaque chargement de la page de
 * compte (propriétaire) et après le retrait d'un membre. Compromis assumé : la correction peut
 * prendre jusqu'à la prochaine visite de cette page, jamais plus.
 */
export async function syncSeatBilling(organizationId: string): Promise<void> {
  if (!isSupabaseAdminConfigured || !isStripeConfigured) return;

  const admin = createAdminClient();
  const { data: billing } = await admin
    .from("organization_billing")
    .select("plan, stripe_subscription_id, editor_seats_billed, viewer_seats_billed, billing_period")
    .eq("organization_id", organizationId)
    .maybeSingle<{
      plan: string; stripe_subscription_id: string | null; editor_seats_billed: number;
      viewer_seats_billed: number; billing_period: string;
    }>();

  if (!billing || billing.plan === "free" || !billing.stripe_subscription_id || !isSelfServeTier(billing.plan)) return;
  const period: BillingPeriod = isBillingPeriod(billing.billing_period) ? billing.billing_period : "monthly";

  const [{ count: editorCount }, { count: viewerCount }] = await Promise.all([
    admin
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("role", ["owner", "member"]),
    admin
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("role", "viewer"),
  ]);

  const editors = editorCount ?? 0;
  const viewers = viewerCount ?? 0;
  if (editors === billing.editor_seats_billed && viewers === billing.viewer_seats_billed) return;

  // On ne persiste que ce qui a réellement été synchronisé avec Stripe — si le prix Spectateur
  // n'est pas encore configuré, editorSeatsAchieved peut avancer sans que viewerSeatsAchieved
  // ne bouge, pour que le prochain appel retente les viewers sans retenter les éditeurs inutilement.
  let editorSeatsAchieved = billing.editor_seats_billed;
  let viewerSeatsAchieved = billing.viewer_seats_billed;

  try {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(billing.stripe_subscription_id);

    // Siège de base (Essentiel/Croissance) : toujours un item présent (l'organisation compte
    // toujours au moins son propriétaire) — on ajuste sa quantité, on ne le supprime jamais.
    if (editors !== billing.editor_seats_billed) {
      const basePriceId = priceIdForTier(billing.plan, period);
      const baseItem = subscription.items.data.find((item) => item.price?.id === basePriceId);
      if (baseItem && baseItem.quantity !== editors) {
        await stripe.subscriptionItems.update(baseItem.id, { quantity: Math.max(editors, 1) });
      }
      editorSeatsAchieved = editors;
    }

    // Siège Spectateur : item optionnel, créé/ajusté/retiré selon le nombre réel de viewers.
    if (viewers !== billing.viewer_seats_billed) {
      if (!isViewerSeatBillingConfigured(period)) {
        console.error("syncSeatBilling: prix Spectateur non configuré pour cette période, sièges non facturés", {
          organizationId,
          viewers,
          period,
        });
      } else {
        const viewerPriceId = viewerSeatPriceId(period);
        const viewerItem = subscription.items.data.find((item) => item.price?.id === viewerPriceId);
        if (viewers > 0) {
          if (viewerItem) {
            if (viewerItem.quantity !== viewers) {
              await stripe.subscriptionItems.update(viewerItem.id, { quantity: viewers });
            }
          } else {
            await stripe.subscriptionItems.create({
              subscription: billing.stripe_subscription_id,
              price: viewerPriceId,
              quantity: viewers,
            });
          }
        } else if (viewerItem) {
          await stripe.subscriptionItems.del(viewerItem.id);
        }
        viewerSeatsAchieved = viewers;
      }
    }
  } catch (err) {
    console.error("syncSeatBilling: échec de synchronisation Stripe", { organizationId, err });
    return;
  }

  if (editorSeatsAchieved !== billing.editor_seats_billed || viewerSeatsAchieved !== billing.viewer_seats_billed) {
    await admin
      .from("organization_billing")
      .update({ editor_seats_billed: editorSeatsAchieved, viewer_seats_billed: viewerSeatsAchieved })
      .eq("organization_id", organizationId);
  }
}
