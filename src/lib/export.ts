import Papa from "papaparse";
import type { Application } from "./types";
import { localToday } from "./dates";
export function applicationCsv(applications: Application[]) {
  return Papa.unparse(
    applications.map((a) => ({
      Date: a.applied_on,
      Company: a.company,
      Role: a.role,
      Location: a.location,
      Type: a.work_type,
      Source: a.source,
      "Job URL": a.job_url,
      "Applied?": a.applied ? "Yes" : "No",
      "Contact Person": a.contact_name,
      "Contact Role": a.contact_role,
      "Contact LinkedIn": a.contact_linkedin,
      "Connection Sent On": a.connection_sent_on,
      "Contacted?": a.messaged ? "Yes" : "No",
      "Messaged On": a.messaged_on,
      "Follow-up 1": a.followup1_on,
      "Follow-up 2": a.followup2_on,
      Status: a.status,
      Response: a.response,
      Screening: a.screening,
      Interview: a.interview,
      Result: a.result,
      Salary: a.salary,
      "Why Applied": a.why_applied,
      Notes: a.notes,
    })),
    { escapeFormulae: true },
  );
}
export function downloadApplicationCsv(applications: Application[]) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + applicationCsv(applications)], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `career-pipeline-${localToday()}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
