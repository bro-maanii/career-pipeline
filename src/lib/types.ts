export const STATUSES = [
  "Saved",
  "Applied",
  "Contacted",
  "Replied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
  "Ghosted",
  "Withdrawn",
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
  "Rozee",
  "Founder Outreach",
  "Recruiter Outreach",
  "Referral",
  "Facebook",
  "Cold Email",
  "Other",
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
  screening: string | null;
  interview: string | null;
  result: string | null;
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

export const CONTACT_STATUSES = [
  "Not Contacted",
  "Messaged",
  "Replied",
  "Interested",
  "No Reply",
  "Not Relevant",
  "Closed",
] as const;
export const CONTACT_TYPES = [
  "Founder",
  "CTO",
  "Engineering Manager",
  "Hiring Manager",
  "Recruiter",
  "Developer",
  "Other",
];
export const INTERVIEW_STAGES = [
  "Screening",
  "Technical",
  "Managerial",
  "Final",
  "HR",
] as const;
export const INTERVIEW_RESULTS = [
  "Pending",
  "Passed",
  "Failed",
  "Offer",
] as const;
export const MILESTONES = ["", "No", "Yes", "Passed", "Failed", "Pending"];
export type Contact = {
  id: string;
  user_id: string;
  created_at: string;
  added_on: string | null;
  person: string;
  role: string | null;
  company: string | null;
  company_type: string | null;
  linkedin_url: string | null;
  why_targeted: string | null;
  messaged: boolean;
  messaged_on: string | null;
  reply: string | null;
  followup1_on: string | null;
  followup2_on: string | null;
  status: (typeof CONTACT_STATUSES)[number];
  message_draft: string | null;
  notes: string | null;
};
export type ContactInput = Omit<Contact, "id" | "user_id" | "created_at">;
export type Interview = {
  id: string;
  user_id: string;
  created_at: string;
  application_id: string | null;
  scheduled_on: string;
  company: string;
  role: string | null;
  stage: (typeof INTERVIEW_STAGES)[number];
  interviewer: string | null;
  questions: string | null;
  answer: string | null;
  mistake: string | null;
  correct_answer: string | null;
  next_action: string | null;
  result: (typeof INTERVIEW_RESULTS)[number];
};
export type InterviewInput = Omit<Interview, "id" | "user_id" | "created_at">;
export const DAILY_METRICS = [
  "applications",
  "direct_outreach",
  "followups",
  "network_actions",
  "replies",
  "screenings",
  "interviews",
  "rejections",
  "offers",
] as const;
export type DailyMetric = (typeof DAILY_METRICS)[number];
export type DailyLogInput = {
  activity_on: string;
  notes: string | null;
} & Record<DailyMetric, number | null>;
export type DailyLog = DailyLogInput & {
  id: string;
  user_id: string;
  created_at: string;
};
export type DailyTargets = Record<
  "applications" | "direct_outreach" | "followups" | "network_actions",
  number
>;
export type TrackerBundle = {
  applications: ApplicationInput[];
  contacts: ContactInput[];
  interviews: InterviewInput[];
  daily_logs: DailyLogInput[];
  daily_targets?: DailyTargets;
};
