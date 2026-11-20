import { localToday, daysBetween } from "./dates";
import { FOLLOWUP_1_DAYS, FOLLOWUP_2_DAYS } from "./config";
import {
  ANSWERED_CONTACT_STATUSES,
  STOPPED_CONTACT_STATUSES,
} from "./followups";
import type {
  Application,
  Contact,
  ContactInput,
  InterviewInput,
  DailyLog,
  DailyLogInput,
  DailyMetric,
  DailyTargets,
  TrackerBundle,
} from "./types";
export const DEFAULT_TARGETS: DailyTargets = {
  applications: 10,
  direct_outreach: 10,
  followups: 5,
  network_actions: 5,
};
export const METRIC_LABELS: Record<DailyMetric, string> = {
  applications: "Applications",
  direct_outreach: "Direct outreach",
  followups: "Follow-ups",
  network_actions: "Network actions",
  replies: "Replies",
  screenings: "Screenings",
  interviews: "Interviews",
  rejections: "Rejections",
  offers: "Offers",
};
export const emptyContact = (): ContactInput => ({
  added_on: localToday(),
  person: "",
  role: "",
  company: "",
  company_type: "",
  linkedin_url: "",
  why_targeted: "",
  messaged: false,
  messaged_on: null,
  reply: "",
  followup1_on: null,
  followup2_on: null,
  status: "Not Contacted",
  message_draft: "",
  notes: "",
});
export const emptyInterview = (): InterviewInput => ({
  application_id: null,
  scheduled_on: localToday(),
  company: "",
  role: "",
  stage: "Technical",
  interviewer: "",
  questions: "",
  answer: "",
  mistake: "",
  correct_answer: "",
  next_action: "",
  result: "Pending",
});
export const emptyDailyLog = (date = localToday()): DailyLogInput => ({
  activity_on: date,
  applications: null,
  direct_outreach: null,
  followups: null,
  network_actions: null,
  replies: null,
  screenings: null,
  interviews: null,
  rejections: null,
  offers: null,
  notes: "",
});
const affirmative = (value: string | null | undefined) =>
  !!value &&
  ["yes", "passed", "failed", "pending", "offer"].includes(
    value.trim().toLowerCase(),
  );
const meaningfulReply = (value: string | null) =>
  !!value?.trim() &&
  !["no", "no reply", "none", "pending", "n/a"].includes(
    value.trim().toLowerCase(),
  );
export function stagesFor(app: Application) {
  const offer =
    app.status === "Offer" || app.result?.trim().toLowerCase() === "offer";
  const interviewed =
    offer || affirmative(app.interview) || app.status === "Interview";
  const screened =
    interviewed || affirmative(app.screening) || app.status === "Screening";
  const replied =
    screened || app.status === "Replied" || meaningfulReply(app.response);
  return { offer, interviewed, screened, replied };
}
export function funnelMetrics(applications: Application[]) {
  const cohort = applications.filter((app) => app.applied);
  const stages = [
    { label: "Applications", count: cohort.length },
    {
      label: "Replies",
      count: cohort.filter((a) => stagesFor(a).replied).length,
    },
    {
      label: "Screenings",
      count: cohort.filter((a) => stagesFor(a).screened).length,
    },
    {
      label: "Interviews",
      count: cohort.filter((a) => stagesFor(a).interviewed).length,
    },
    { label: "Offers", count: cohort.filter((a) => stagesFor(a).offer).length },
  ];
  return stages.map((stage, index) => ({
    ...stage,
    rate:
      index === 0
        ? null
        : stages[index - 1].count
          ? stage.count / stages[index - 1].count
          : null,
  }));
}
export function sourceMetrics(applications: Application[]) {
  const grouped = new Map<string, Application[]>();
  applications
    .filter((a) => a.applied)
    .forEach((app) => {
      const key = app.source?.trim() || "Not specified";
      grouped.set(key, [...(grouped.get(key) || []), app]);
    });
  return [...grouped]
    .map(([source, rows]) => ({
      source,
      applications: rows.length,
      replies: rows.filter((a) => stagesFor(a).replied).length,
      interviews: rows.filter((a) => stagesFor(a).interviewed).length,
      offers: rows.filter((a) => stagesFor(a).offer).length,
    }))
    .sort((a, b) => b.applications - a.applications);
}
export function dailyMetrics(
  date: string,
  apps: Application[],
  contacts: Contact[],
  logs: DailyLog[],
) {
  const auto: Record<DailyMetric, number> = {
    applications: apps.filter((a) => a.applied && a.applied_on === date).length,
    direct_outreach: contacts.filter(
      (c) => c.messaged && c.messaged_on === date,
    ).length,
    followups: [...apps, ...contacts].reduce(
      (sum, a) =>
        sum + Number(a.followup1_on === date) + Number(a.followup2_on === date),
      0,
    ),
    network_actions: 0,
    replies: 0,
    screenings: 0,
    interviews: 0,
    rejections: 0,
    offers: 0,
  };
  const log = logs.find((row) => row.activity_on === date);
  const result = { ...auto };
  if (log)
    (Object.keys(result) as DailyMetric[]).forEach((key) => {
      if (log[key] !== null) result[key] = log[key];
    });
  return result;
}
export function contactNextStep(
  contact: Contact,
  today: string,
): {
  kind: "first_message" | "followup1" | "followup2";
  label: string;
  overdue: number;
} | null {
  if (STOPPED_CONTACT_STATUSES.includes(contact.status)) return null;
  if (!contact.messaged)
    return { kind: "first_message", label: "First message", overdue: 0 };
  if (ANSWERED_CONTACT_STATUSES.includes(contact.status)) return null;
  if (
    !contact.followup1_on &&
    contact.messaged_on &&
    daysBetween(contact.messaged_on, today) >= FOLLOWUP_1_DAYS
  )
    return {
      kind: "followup1",
      label: "Follow-up 1",
      overdue: daysBetween(contact.messaged_on, today) - FOLLOWUP_1_DAYS,
    };
  if (
    contact.followup1_on &&
    !contact.followup2_on &&
    daysBetween(contact.followup1_on, today) >= FOLLOWUP_2_DAYS
  )
    return {
      kind: "followup2",
      label: "Follow-up 2",
      overdue: daysBetween(contact.followup1_on, today) - FOLLOWUP_2_DAYS,
    };
  return null;
}
export const emptyBundle = (): TrackerBundle => ({
  applications: [],
  contacts: [],
  interviews: [],
  daily_logs: [],
});
const normalize = (value: string | null) =>
  (value || "").trim().toLowerCase().replace(/\s+/g, " ");
export function deduplicateBundle(
  bundle: TrackerBundle,
  existing: {
    applications: Application[];
    contacts: Contact[];
    interviews: (InterviewInput & { id?: string })[];
  },
) {
  let skipped = 0;
  const distinct = <T>(rows: T[], prior: T[], key: (row: T) => string) => {
    const seen = new Set(prior.map(key));
    return rows.filter((row) => {
      const id = key(row);
      if (seen.has(id)) {
        skipped++;
        return false;
      }
      seen.add(id);
      return true;
    });
  };
  const applications = distinct(
    bundle.applications,
    existing.applications,
    (row) =>
      [normalize(row.company), normalize(row.role), row.applied_on || ""].join(
        "|",
      ),
  );
  const contacts = distinct(bundle.contacts, existing.contacts, (row) =>
    [normalize(row.person), normalize(row.company), row.added_on || ""].join(
      "|",
    ),
  );
  const interviews = distinct(bundle.interviews, existing.interviews, (row) =>
    [
      normalize(row.company),
      normalize(row.role),
      row.scheduled_on,
      row.stage,
    ].join("|"),
  );
  return { bundle: { ...bundle, applications, contacts, interviews }, skipped };
}
