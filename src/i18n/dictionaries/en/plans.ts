import type { plans as fr, viewerSeat as frViewerSeat } from "../fr/plans";

export const plans: typeof fr = {
  free: { label: "Free", tagline: "No active plan" },
  essentiel: { label: "Essential", tagline: "To start an automation program (recommended for 1 to 5 users)" },
  croissance: { label: "Growth", tagline: "For a team that assesses continuously (recommended for 6 to 20 users)" },
  entreprise: { label: "Enterprise", tagline: "Negotiated per-user pricing, priority support" },
} as const;

export const perUserLabel = "user";

export const viewerSeat: typeof frViewerSeat = {
  label: "Viewer",
  unitLabel: "person",
  tagline: "To view the processes completed by your colleagues, without editing them",
  addOnNote: "Adds on to an Essential, Growth, or Enterprise organization — invite a member with the Viewer role from your account.",
  inviteHint: "Viewer: {price}.",
} as const;
