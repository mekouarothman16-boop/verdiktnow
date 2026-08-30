import type { AnalysisResult, Answers, Context, RoiInputs, Weights } from "@/lib/scoring";

export type Plan = "free" | "essentiel" | "croissance" | "entreprise";
export type OrgRole = "owner" | "member" | "viewer";

export type ProfileRow = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type OrganizationRow = {
  id: string;
  name: string;
  constants: { hoursPerFte: number; magnitudeRef: number };
  created_at: string;
  updated_at: string;
};

export type OrganizationBillingRow = {
  organization_id: string;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  ai_quota_override: number | null;
  editor_seats_billed: number;
  viewer_seats_billed: number;
  billing_period: "monthly" | "annual";
};

export type OrganizationMemberRow = {
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
};

export type OrganizationInviteRow = {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
};

export type AiUsageEventRow = {
  id: string;
  organization_id: string;
  created_at: string;
};

export type ProcessRow = {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  currency: "CAD" | "USD";
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  tags: string[];
};

export type WeightProfileRow = {
  id: string;
  organization_id: string;
  name: string;
  category: string | null;
  weights: Weights;
  created_by: string | null;
  created_at: string;
};

export type ProcessShareLinkRow = {
  id: string;
  process_id: string;
  token: string;
  created_by: string | null;
  created_at: string;
  revoked_at: string | null;
};

export type ActivityLogRow = {
  id: string;
  organization_id: string;
  process_id: string | null;
  actor_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
};

export type AssessmentRow = {
  process_id: string;
  context: Context;
  answers: Answers;
  weights: Weights;
  aptitude_score: number | null;
  ai_analysis: AnalysisResult | null;
  updated_at: string;
};

export type RoiInputsRow = {
  process_id: string;
  inputs: RoiInputs;
  value_score: number | null;
  updated_at: string;
};

export type SecondOpinionRow = {
  id: string;
  process_id: string;
  respondent_id: string;
  answers: Answers;
  submitted_at: string;
  updated_at: string;
};

export type RoadmapProgressRow = {
  id: string;
  process_id: string;
  step_key: string;
  done: boolean;
  done_by: string | null;
  done_at: string | null;
  text: string | null;
  is_custom: boolean;
  phase_key: string | null;
  due_date: string | null;
  due_date_set_by: string | null;
  assigned_to: string | null;
  title: string | null;
  start_date: string | null;
  progress_percent: number;
  is_blocking: boolean;
  status_color: "green" | "yellow" | "red" | "gray" | null;
  blocking_detail: string | null;
  blocking_resolution: string | null;
  updated_at: string;
};

export type AssessmentHistoryRow = {
  id: string;
  process_id: string;
  context: Context;
  answers: Answers;
  weights: Weights;
  aptitude_score: number | null;
  roi_inputs: RoiInputs;
  value_score: number | null;
  net_recurring: number | null;
  saved_by: string | null;
  saved_at: string;
};
