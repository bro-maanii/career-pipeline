import { FOLLOWUP_1_DAYS, FOLLOWUP_2_DAYS } from "./config";
import { daysBetween } from "./dates";
import type { Application, TemplateKind } from "./types";
export function isDue(
  app: Application,
  kind: TemplateKind,
  today: string,
): boolean {
  if (app.status === "Withdrawn") return false;
  if (kind === "first_message")
    return !!app.contact_name?.trim() && !app.messaged;
  if (["Rejected", "Offer"].includes(app.status)) return false;
  if (kind === "followup1")
    return (
      app.messaged &&
      !app.followup1_on &&
      !!app.messaged_on &&
      daysBetween(app.messaged_on, today) >= FOLLOWUP_1_DAYS
    );
  return (
    !!app.followup1_on &&
    !app.followup2_on &&
    daysBetween(app.followup1_on, today) >= FOLLOWUP_2_DAYS
  );
}
export function overdueDays(
  app: Application,
  kind: TemplateKind,
  today: string,
): number | null {
  const date =
    kind === "first_message"
      ? app.connection_sent_on
      : kind === "followup1"
        ? app.messaged_on
        : app.followup1_on;
  if (!date) return null;
  return Math.max(
    0,
    daysBetween(date, today) -
      (kind === "followup1"
        ? FOLLOWUP_1_DAYS
        : kind === "followup2"
          ? FOLLOWUP_2_DAYS
          : 0),
  );
}
export function fillTemplate(body: string, app: Application): string {
  const values: Record<string, string> = {
    name: app.contact_name?.trim().split(/\s+/)[0] || "there",
    company: app.company,
    role: app.role || "developer",
  };
  return body.replace(
    /\{(name|company|role)\}/g,
    (_, key: string) => values[key],
  );
}
