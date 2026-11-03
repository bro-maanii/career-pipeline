export const STATUSES = [
  "Applied",
  "Replied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
  "Ghosted",
] as const;
export type Status = (typeof STATUSES)[number];
export const WORK_TYPES = [
  "Karachi Onsite",
  "Karachi Hybrid",
  "International Remote",
  "Pakistan Remote",
];
export const SOURCES = [
  "LinkedIn Post",
  "LinkedIn Job",
  "Indeed",
  "WhatsApp",
  "Company Website",
];
export const TEMPLATE_KINDS = [
  "first_message",
  "followup1",
  "followup2",
] as const;
export type TemplateKind = (typeof TEMPLATE_KINDS)[number];
export const KIND_LABELS: Record<TemplateKind, string> = {
  first_message: "First message",
  followup1: "Follow-up 1",
  followup2: "Follow-up 2",
};
export type Application = {
  id: string;
  user_id: string;
  created_at: string;
  applied_on: string | null;
  company: string;
  role: string | null;
  location: string | null;
  work_type: string | null;
  source: string | null;
  job_url: string | null;
  applied: boolean;
  contact_name: string | null;
  contact_role: string | null;
  contact_linkedin: string | null;
  connection_sent_on: string | null;
  messaged: boolean;
  messaged_on: string | null;
  followup1_on: string | null;
  followup2_on: string | null;
  status: Status;
  response: string | null;
  salary: string | null;
  why_applied: string | null;
  notes: string | null;
};
export type ApplicationInput = Omit<
  Application,
  "id" | "user_id" | "created_at"
>;
export type Template = {
  id: string;
  user_id: string;
  kind: TemplateKind;
  title: string;
  body: string;
};
export type TemplateInput = Omit<Template, "id" | "user_id">;
