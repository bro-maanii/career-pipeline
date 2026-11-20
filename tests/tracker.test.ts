import test from "node:test";
import assert from "node:assert/strict";
import { parseDate, parseImport, emptyApplication } from "../src/lib/csv";
import { daysBetween, localToday } from "../src/lib/dates";
import {
  isDue,
  overdueDays,
  fillTemplate,
  statusAfterMessage,
} from "../src/lib/followups";
import type { Application } from "../src/lib/types";
const app = (values: Partial<Application> = {}): Application => ({
  ...emptyApplication(),
  id: "1",
  user_id: "user",
  created_at: "2026-11-01T00:00:00Z",
  ...values,
});

test("CSV parses day-first, ISO and Excel dates, including leap years", () => {
  for (const date of ["03/11/26", "03/11/2026", "2026-11-03", "46329"])
    assert.equal(parseDate(date), "2026-11-03");
  assert.equal(parseDate("29/02/24"), "2024-02-29");
  for (const date of [
    "31/02/2026",
    "29/02/2025",
    "2026-13-01",
    "60",
    "0",
    "junk",
  ])
    assert.equal(parseDate(date), null);
  assert.equal(parseDate("1"), "1900-01-01");
  assert.equal(parseDate("61"), "1900-03-01");
});
test("CSV maps all required headers, quoted content, booleans and import-date fallbacks", () => {
  const input =
    '\uFEFFDate,Company,Role,Location,Type,Source,Job URL,Applied?,Contact Person,Contact Role,Contacted?,Follow-up 1,Follow-up 2,Status,Response,Salary,Why Applied,Notes\r\n03/11/26,"Acme, Inc.",Developer,Karachi,Pakistan Remote,LinkedIn Job,https://example.com,Yes,Ali Khan,Recruiter,YES,YESSSS,yes,Interview,"Sounds good, thanks",200k,Great team,"Line 1\nLine 2"\r\n,,,,,,,,,,,,,,,,,\r\n';
  const { rows, errors } = parseImport(input, "2026-11-05");
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 1);
  const row = rows[0];
  assert.equal(row.company, "Acme, Inc.");
  assert.equal(row.applied_on, "2026-11-03");
  assert.equal(row.connection_sent_on, "2026-11-03");
  assert.equal(row.messaged_on, "2026-11-03");
  assert.equal(row.followup1_on, "2026-11-05");
  assert.equal(row.followup2_on, "2026-11-05");
  assert.equal(row.applied, true);
  assert.equal(row.messaged, true);
  assert.equal(row.status, "Interview");
  assert.equal(row.work_type, "Pakistan Remote");
  assert.equal(row.response, "Sounds good, thanks");
  assert.equal(row.notes, "Line 1\nLine 2");
});
test("CSV preserves explicit message/connection dates and completed follow-up dates", () => {
  const { rows, errors } = parseImport(
    "Date,Company,Applied?,Contacted?,Messaged On,Connection Sent On,Follow-up 1,Follow-up 2\n01/11/26,Acme,No,Yes,02/11/26,30/10/26,03/11/26,46331",
  );
  assert.deepEqual(errors, []);
  assert.equal(rows[0].applied, false);
  assert.equal(rows[0].messaged_on, "2026-11-02");
  assert.equal(rows[0].connection_sent_on, "2026-10-30");
  assert.equal(rows[0].followup1_on, "2026-11-03");
  assert.equal(rows[0].followup2_on, "2026-11-05");
});
test("CSV reports invalid dates, missing company/header, unknown statuses and malformed rows", () => {
  assert.ok(
    parseImport("Role\nDeveloper").errors.some((e) => e.includes("header")),
  );
  const bad = parseImport(
    "Company,Date,Status\nAcme,31/02/26,Hired\n,01/11/26,Applied",
  );
  assert.equal(bad.errors.length, 3);
  assert.ok(parseImport("Company,Date\nAcme,01/11/26,extra").errors.length);
  assert.equal(parseImport("Company,Date\n,\n").rows.length, 0);
});
test("CSV treats No follow-up cells as incomplete", () => {
  const { rows, errors } = parseImport(
    "Company,Follow-up 1,Follow-up 2\nAcme,No,FALSE\nBeta,0,",
  );
  assert.deepEqual(errors, []);
  rows.forEach((row) => {
    assert.equal(row.followup1_on, null);
    assert.equal(row.followup2_on, null);
  });
});
test("first message requires a named contact, not a date or open status", () => {
  assert.equal(
    isDue(
      app({ contact_name: "Ali", status: "Offer" }),
      "first_message",
      "2026-11-03",
    ),
    true,
  );
  assert.equal(
    isDue(app({ contact_name: "   " }), "first_message", "2026-11-03"),
    false,
  );
  assert.equal(
    isDue(
      app({ contact_name: "Ali", messaged: true }),
      "first_message",
      "2026-11-03",
    ),
    false,
  );
});
test("follow-up 1 starts at day 3; missing dates and completed/closed rows stay out", () => {
  const base = app({ messaged: true, messaged_on: "2026-10-31" });
  assert.equal(isDue(base, "followup1", "2026-11-02"), false);
  assert.equal(isDue(base, "followup1", "2026-11-03"), true);
  assert.equal(overdueDays(base, "followup1", "2026-11-03"), 0);
  assert.equal(overdueDays(base, "followup1", "2026-11-05"), 2);
  for (const status of [
    "Rejected",
    "Offer",
    "Replied",
    "Screening",
    "Interview",
    "Ghosted",
    "Withdrawn",
  ] as const)
    assert.equal(isDue({ ...base, status }, "followup1", "2026-11-05"), false);
  for (const status of ["Saved", "Applied", "Contacted"] as const)
    assert.equal(isDue({ ...base, status }, "followup1", "2026-11-05"), true);
  assert.equal(
    isDue({ ...base, messaged_on: null }, "followup1", "2026-11-05"),
    false,
  );
  assert.equal(
    isDue({ ...base, followup1_on: "2026-11-03" }, "followup1", "2026-11-05"),
    false,
  );
});
test("follow-up 2 starts at day 4 after follow-up 1 and excludes closed or completed rows", () => {
  const base = app({ followup1_on: "2026-10-30" });
  assert.equal(isDue(base, "followup2", "2026-11-02"), false);
  assert.equal(isDue(base, "followup2", "2026-11-03"), true);
  assert.equal(
    isDue({ ...base, followup2_on: "2026-11-03" }, "followup2", "2026-11-05"),
    false,
  );
  for (const status of ["Rejected", "Offer"] as const)
    assert.equal(isDue({ ...base, status }, "followup2", "2026-11-05"), false);
  assert.equal(overdueDays(base, "followup2", "2026-11-05"), 2);
});
test("template interpolation uses first name and safely preserves literal dollar signs", () => {
  assert.equal(
    fillTemplate(
      "Hi {name}, {role} at {company}. Thanks {name}!",
      app({
        contact_name: "  Ali Khan ",
        company: "$& Labs",
        role: "Next.js developer",
      }),
    ),
    "Hi Ali, Next.js developer at $& Labs. Thanks Ali!",
  );
  assert.equal(fillTemplate("Hi {name}", app()), "Hi there");
});
test("local date and calendar-day differences cross year and DST boundaries", () => {
  assert.equal(localToday(new Date(2026, 10, 3, 0, 1)), "2026-11-03");
  assert.equal(daysBetween("2025-12-31", "2026-01-03"), 3);
  assert.equal(daysBetween("2026-03-07", "2026-03-10"), 3);
  assert.equal(daysBetween("2026-11-03", "2026-11-01"), -2);
});
test("ghosted stops the first message; marking a message moves early statuses to Contacted", () => {
  assert.equal(
    isDue(
      app({ contact_name: "Ali", status: "Ghosted" }),
      "first_message",
      "2026-11-03",
    ),
    false,
  );
  assert.equal(statusAfterMessage("Saved"), "Contacted");
  assert.equal(statusAfterMessage("Applied"), "Contacted");
  assert.equal(statusAfterMessage("Interview"), "Interview");
  assert.equal(statusAfterMessage("Rejected"), "Rejected");
});
