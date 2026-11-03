import Papa from "papaparse";
import { parseImport, parseDate, isYes } from "./csv";
import { localToday } from "./dates";
import {
  emptyBundle,
  emptyContact,
  emptyInterview,
  emptyDailyLog,
  DEFAULT_TARGETS,
} from "./tracker";
import {
  CONTACT_STATUSES,
  INTERVIEW_STAGES,
  INTERVIEW_RESULTS,
  DAILY_METRICS,
  type TrackerBundle,
  type DailyMetric,
} from "./types";
export type ImportSheet = { sheet: string; data: unknown[][] };
export type ImportPreview = {
  bundle: TrackerBundle;
  errors: string[];
  sheets: string[];
};
const text = (value: unknown): string =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : value === null || value === undefined
      ? ""
      : String(value).trim();
const header = (value: unknown) =>
  text(value)
    .replace(/^\uFEFF/, "")
    .toLowerCase();
export function parseTrackerSheets(
  sheets: ImportSheet[],
  today = localToday(),
): ImportPreview {
  const bundle = emptyBundle();
  const errors: string[] = [];
  const recognized: string[] = [];
  for (const sheet of sheets) {
    const headers = (sheet.data[0] || []).map(header);
    let kind: "applications" | "contacts" | "interviews" | "daily_logs" | null =
      null;
    if (headers.includes("company") && headers.includes("applied?"))
      kind = "applications";
    else if (headers.includes("person") && headers.includes("date added"))
      kind = "contacts";
    else if (headers.includes("stage") && headers.includes("questions asked"))
      kind = "interviews";
    else if (
      headers.includes("date") &&
      headers.includes("applications") &&
      headers.includes("network actions")
    )
      kind = "daily_logs";
    else if (
      headers.includes("company") &&
      !headers.includes("source performance")
    )
      kind = "applications";
    if (!kind) continue;
    recognized.push(sheet.sheet);
    if (kind === "applications") {
      sheet.data.slice(1).forEach((row, index) => {
        if (row.slice(headers.length).some((value) => text(value)))
          errors.push(
            `${sheet.sheet}, row ${index + 2}: More cells than column headers.`,
          );
      });
      const result = parseImport(
        Papa.unparse(
          sheet.data.map((row) => headers.map((_, index) => text(row[index]))),
        ),
        today,
      );
      bundle.applications.push(...result.rows);
      errors.push(...result.errors.map((error) => `${sheet.sheet}: ${error}`));
      continue;
    }
    sheet.data.slice(1).forEach((row, index) => {
      const record = Object.fromEntries(
        headers.map((key, i) => [key, text(row[i])]),
      );
      const get = (key: string) => record[key] || "";
      const fail = (message: string) =>
        errors.push(`${sheet.sheet}, row ${index + 2}: ${message}`);
      const date = (key: string) => {
        const value = get(key);
        if (!value) return null;
        const result = parseDate(value);
        if (!result) fail(`Invalid ${key}: ${value}.`);
        return result;
      };
      const followup = (key: string) =>
        /^(no|false|0)$/i.test(get(key))
          ? null
          : isYes(get(key))
            ? today
            : date(key);
      if (kind === "contacts") {
        if (!headers.some((key, i) => key !== "#" && text(row[i]))) return;
        const contact = emptyContact();
        contact.person = get("person");
        if (!contact.person) {
          fail("Person is required.");
          return;
        }
        contact.added_on = date("date added");
        contact.company = get("company");
        contact.role = get("role");
        contact.company_type = get("company type");
        contact.linkedin_url = get("linkedin url");
        contact.why_targeted = get("why targeted");
        contact.messaged = isYes(get("message sent?"));
        contact.messaged_on =
          date("messaged on") || (contact.messaged ? contact.added_on : null);
        contact.reply = get("reply");
        contact.followup1_on = followup("follow-up 1");
        contact.followup2_on = followup("follow-up 2");
        const status = CONTACT_STATUSES.find(
          (s) => s.toLowerCase() === get("status").toLowerCase(),
        );
        if (get("status") && !status)
          fail(`Unknown contact status: ${get("status")}.`);
        contact.status =
          status || (contact.messaged ? "Messaged" : "Not Contacted");
        contact.notes = get("notes");
        contact.message_draft =
          get("message draft") ||
          (/^hi\b/i.test(contact.notes) ? contact.notes : "");
        bundle.contacts.push(contact);
      } else if (kind === "interviews") {
        if (!headers.some((key, i) => key !== "#" && text(row[i]))) return;
        const interview = emptyInterview();
        interview.company = get("company");
        if (!interview.company) {
          fail("Company is required.");
          return;
        }
        const on = date("date");
        if (!on) {
          if (!get("date")) fail("Interview date is required.");
          return;
        }
        interview.scheduled_on = on;
        interview.role = get("role");
        const stage = INTERVIEW_STAGES.find(
          (s) => s.toLowerCase() === get("stage").toLowerCase(),
        );
        const result = INTERVIEW_RESULTS.find(
          (s) => s.toLowerCase() === get("result").toLowerCase(),
        );
        if (get("stage") && !stage)
          fail(`Unknown interview stage: ${get("stage")}.`);
        if (get("result") && !result)
          fail(`Unknown interview result: ${get("result")}.`);
        interview.stage = stage || "Technical";
        interview.result = result || "Pending";
        interview.interviewer = get("interviewer");
        interview.questions = get("questions asked");
        interview.answer = get("your answer / what happened");
        interview.mistake = get("mistake");
        interview.correct_answer = get("correct answer");
        interview.next_action = get("action before next interview");
        bundle.interviews.push(interview);
      } else if (kind === "daily_logs") {
        if (!get("date") && !headers.slice(1, 10).some((key) => get(key)))
          return;
        const on = date("date");
        if (!on) {
          if (!get("date")) fail("Activity date is required.");
          return;
        }
        const log = emptyDailyLog(on);
        const map: Record<DailyMetric, string> = {
          applications: "applications",
          direct_outreach: "direct outreach",
          followups: "follow-ups",
          network_actions: "network actions",
          replies: "replies",
          screenings: "screenings",
          interviews: "interviews",
          rejections: "rejections",
          offers: "offers",
        };
        DAILY_METRICS.forEach((key) => {
          const value = get(map[key]);
          if (!value) return;
          const count = Number(value);
          if (!Number.isSafeInteger(count) || count < 0 || count > 1000000)
            fail(`${map[key]} must be a whole number from 0 to 1,000,000.`);
          else log[key] = count;
        });
        log.notes = get("notes");
        if (bundle.daily_logs.some((existing) => existing.activity_on === on))
          fail(`Duplicate daily log date ${on}.`);
        else bundle.daily_logs.push(log);
      }
    });
    if (kind === "daily_logs") {
      const targetColumn = headers.indexOf("daily targets");
      if (targetColumn !== -1) {
        const targets = { ...DEFAULT_TARGETS };
        const labels = {
          applications: "applications",
          direct_outreach: "direct outreach",
          followups: "follow-ups",
          network_actions: "network actions",
        };
        sheet.data.slice(1).forEach((row) => {
          const key = (Object.keys(labels) as (keyof typeof labels)[]).find(
            (key) => labels[key] === header(row[targetColumn]),
          );
          if (!key || !text(row[targetColumn + 1])) return;
          const count = Number(row[targetColumn + 1]);
          if (!Number.isSafeInteger(count) || count < 0 || count > 1000000)
            errors.push(
              `${sheet.sheet}: Invalid daily target for ${labels[key]}.`,
            );
          else targets[key] = count;
        });
        bundle.daily_targets = targets;
      }
    }
  }
  if (!recognized.length)
    errors.push(
      "No tracker sheets found. Choose your job tracker workbook or a CSV exported from Job Tracker, Contacts, Interview Log, or Daily Dashboard.",
    );
  return { bundle, errors, sheets: recognized };
}
export function parseTrackerCsv(
  csv: string,
  today = localToday(),
): ImportPreview {
  const parsed = Papa.parse<unknown[]>(csv, { skipEmptyLines: "greedy" });
  const result = parseTrackerSheets(
    [{ sheet: "CSV", data: parsed.data }],
    today,
  );
  const width = parsed.data[0]?.length || 0;
  parsed.data.slice(1).forEach((row, index) => {
    if (row.length !== width && row.some((value) => text(value)))
      result.errors.push(
        `CSV row ${index + 2}: Expected ${width} columns, found ${row.length}.`,
      );
  });
  result.errors.unshift(
    ...parsed.errors.map((error) => `CSV: ${error.message}`),
  );
  return result;
}
export async function readTrackerFile(
  file: File,
  today = localToday(),
): Promise<ImportPreview> {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Please choose a file smaller than 5 MB.");
  if (/\.csv$/i.test(file.name))
    return parseTrackerCsv(await file.text(), today);
  if (!/\.xlsx$/i.test(file.name))
    throw new Error(
      "Choose an .xlsx workbook or .csv file. Windows shortcuts (.lnk) cannot be imported.",
    );
  const { default: readWorkbook } = await import("read-excel-file/universal");
  return parseTrackerSheets(await readWorkbook(file), today);
}
