import Papa from "papaparse";
import { localToday } from "./dates";
import { STATUSES, type ApplicationInput, type Status } from "./types";
export const emptyApplication = (): ApplicationInput => ({
  applied_on: localToday(),
  company: "",
  role: "",
  location: "",
  work_type: "",
  source: "",
  job_url: "",
  applied: true,
  contact_name: "",
  contact_role: "",
  contact_linkedin: "",
  connection_sent_on: null,
  messaged: false,
  messaged_on: null,
  followup1_on: null,
  followup2_on: null,
  status: "Applied",
  response: "",
  salary: "",
  why_applied: "",
  notes: "",
});
function validDate(year: number, month: number, day: number): string | null {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    year < 1900 ||
    year > 9999 ||
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  )
    return null;
  return d.toISOString().slice(0, 10);
}
export function parseDate(value: string): string | null {
  const s = value.trim();
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return validDate(+iso[1], +iso[2], +iso[3]);
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (slash)
    return validDate(
      slash[3].length === 2 ? 2000 + +slash[3] : +slash[3],
      +slash[2],
      +slash[1],
    );
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = Math.floor(Number(s));
    // Excel's 1900 system includes a fictitious leap day (serial 60).
    if (serial < 1 || serial === 60 || serial > 2958465) return null;
    const d = new Date(
      Date.UTC(1899, 11, 31) + (serial > 60 ? serial - 1 : serial) * 86400000,
    );
    return d.toISOString().slice(0, 10);
  }
  return null;
}
export const isYes = (s: string) => /^(yes+|true|1)$/i.test(s.trim());
export function parseImport(
  csv: string,
  today = localToday(),
): { rows: ApplicationInput[]; errors: string[] } {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) =>
      h
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase(),
  });
  const errors = parsed.errors.map(
    (e) => `CSV ${e.row === undefined ? "" : `row ${e.row + 2}: `}${e.message}`,
  );
  const fields = parsed.meta.fields || [];
  if (!fields.includes("company"))
    errors.push('Missing required "Company" header.');
  const rows: ApplicationInput[] = [];
  parsed.data.forEach((record, index) => {
    if (!Object.values(record).some((v) => typeof v === "string" && v.trim()))
      return;
    const get = (...keys: string[]) => {
      for (const key of keys) {
        const value = record[key];
        if (typeof value === "string" && value.trim()) return value.trim();
      }
      return "";
    };
    const rowNumber = index + 2;
    const date = (label: string, ...aliases: string[]) => {
      const raw = get(label, ...aliases);
      if (!raw) return null;
      const result = parseDate(raw);
      if (!result)
        errors.push(`Row ${rowNumber}: invalid ${label} date "${raw}".`);
      return result;
    };
    const followup = (key: string) =>
      /^(no|false|0)$/i.test(get(key))
        ? null
        : isYes(get(key))
          ? today
          : date(key);
    const app = emptyApplication();
    app.company = get("company");
    if (!app.company) {
      errors.push(`Row ${rowNumber}: Company is required.`);
      return;
    }
    app.applied_on = date("date", "applied_on");
    app.role = get("role");
    app.location = get("location");
    app.work_type = get("type", "work_type");
    app.source = get("source");
    app.job_url = get("job url", "job_url");
    app.applied = get("applied?", "applied")
      ? isYes(get("applied?", "applied"))
      : true;
    app.contact_name = get("contact person", "contact_name");
    app.contact_role = get("contact role", "contact_role");
    app.contact_linkedin = get("contact linkedin", "contact_linkedin");
    app.connection_sent_on =
      date("connection sent on", "connection_sent_on") || app.applied_on;
    app.messaged = isYes(get("contacted?", "messaged"));
    app.messaged_on =
      date("messaged on", "messaged_on") ||
      (app.messaged ? app.applied_on : null);
    app.followup1_on = followup("follow-up 1");
    app.followup2_on = followup("follow-up 2");
    const status = get("status");
    const normalizedStatus = STATUSES.find(
      (s) => s.toLowerCase() === status.toLowerCase(),
    );
    if (status && !normalizedStatus)
      errors.push(`Row ${rowNumber}: unknown status "${status}".`);
    app.status = (normalizedStatus || "Applied") as Status;
    app.response = get("response");
    app.salary = get("salary");
    app.why_applied = get("why applied", "why_applied");
    app.notes = get("notes");
    rows.push(app);
  });
  return { rows, errors };
}
