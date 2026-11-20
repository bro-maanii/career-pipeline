import { statusAfterMessage } from "./followups";
import { emptyContact } from "./tracker";
import type {
  Application,
  ApplicationInput,
  Contact,
  ContactInput,
  TemplateKind,
} from "./types";

/** What a reply means for the next step. */
export const REPLY_OUTCOMES = [
  {
    value: "progress",
    label: "Baat aage chal rahi hai",
    hint: "Interview, CV, call ya koi aur next step. Follow-ups band.",
  },
  {
    value: "referred",
    label: "Refer kar diya / baad mein batayenge",
    hint: "Follow-up ki ghari aaj se dobara shuru, phir update poochna.",
  },
  {
    value: "redirect",
    label: "Kisi aur se baat karo (HR waghera)",
    hint: "Naya banda Today par “first message” mein aa jayega.",
  },
  {
    value: "declined",
    label: "Mana kar diya",
    hint: "Position fill ho gayi ya interest nahi. Sab reminders band.",
  },
] as const;
export type ReplyOutcome = (typeof REPLY_OUTCOMES)[number]["value"];

export type RedirectPerson = {
  person: string;
  role: string;
  linkedin_url: string;
};

const DEFAULT_TEXT: Record<ReplyOutcome, string> = {
  progress: "Replied",
  referred: "Referred me",
  redirect: "Pointed me to someone else",
  declined: "Declined",
};

const replyText = (outcome: ReplyOutcome, text: string) =>
  text.trim() || DEFAULT_TEXT[outcome];

/**
 * Restart the waiting clock from today for the follow-up that is currently due,
 * so the next reminder arrives after the usual gap. Earlier dates stay intact.
 */
function restartClock(kind: TemplateKind, today: string) {
  return kind === "followup2"
    ? { followup1_on: today }
    : { messaged: true, messaged_on: today };
}

export function applicationReplyUpdate(
  app: Application,
  kind: TemplateKind,
  outcome: ReplyOutcome,
  text: string,
  today: string,
): Partial<ApplicationInput> {
  const response = replyText(outcome, text);
  if (outcome === "referred")
    return {
      response,
      status: statusAfterMessage(app.status),
      ...restartClock(kind, today),
    };
  if (outcome === "declined") return { response, status: "Rejected" };
  return { response, status: "Replied" };
}

export function contactReplyUpdate(
  contact: Contact,
  kind: TemplateKind,
  outcome: ReplyOutcome,
  text: string,
  today: string,
): Partial<ContactInput> {
  const reply = replyText(outcome, text);
  if (outcome === "referred")
    return {
      reply,
      status: contact.status === "Not Contacted" ? "Messaged" : contact.status,
      ...restartClock(kind, today),
    };
  if (outcome === "declined") return { reply, status: "Closed" };
  return { reply, status: "Replied" };
}

/** A fresh outreach contact for the person the reply pointed to. */
export function redirectedContact(
  next: RedirectPerson,
  from: { name: string; company: string; role: string | null; text: string },
  today: string,
): ContactInput {
  const first = next.person.trim().split(/\s+/)[0];
  const by = from.name.trim().split(/\s+/)[0] || "Your colleague";
  const position = from.role?.trim()
    ? `the ${from.role.trim()} role`
    : "a role";
  const reply = from.text.trim();
  return {
    ...emptyContact(),
    added_on: today,
    person: next.person.trim(),
    role: next.role.trim(),
    company: from.company,
    linkedin_url: next.linkedin_url.trim(),
    why_targeted: `${from.name.trim() || "A contact"} suggested reaching out about ${position}.${
      reply ? ` Their reply: “${reply}”` : ""
    }`,
    message_draft: `Hi ${first}, ${by} suggested I reach out to you about ${position} at ${from.company || "your company"}. I’d love to be considered and can share my CV and portfolio. Is there a good time to connect? Thanks!`,
  };
}
