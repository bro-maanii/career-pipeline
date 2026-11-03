import test from "node:test";
import assert from "node:assert/strict";
import { parseTrackerSheets, parseTrackerCsv } from "../src/lib/import";
import { emptyApplication } from "../src/lib/csv";
import { applicationCsv } from "../src/lib/export";
import {
  dailyMetrics,
  deduplicateBundle,
  emptyBundle,
  emptyContact,
  emptyDailyLog,
  funnelMetrics,
  sourceMetrics,
  contactNextStep,
} from "../src/lib/tracker";
import { isDue } from "../src/lib/followups";
import type { Application, Contact, DailyLog } from "../src/lib/types";
const application = (values: Partial<Application> = {}): Application => ({
  ...emptyApplication(),
  id: "app",
  user_id: "owner",
  created_at: "2026-11-04T00:00:00Z",
  ...values,
});
const contact = (values: Partial<Contact> = {}): Contact => ({
  ...emptyContact(),
  id: "contact",
  user_id: "owner",
  created_at: "2026-11-04T00:00:00Z",
  ...values,
});
test("workbook import preserves every workflow and skips row-number-only/formula rows", () => {
  const result = parseTrackerSheets(
    [
      {
        sheet: "Job Tracker",
        data: [
          [
            "#",
            "Date",
            "Company",
            "Role",
            "Applied?",
            "Status",
            "Screening",
            "Interview",
            "Result",
          ],
          [
            1,
            new Date("2026-10-07T00:00:00Z"),
            "Acme",
            "React developer",
            "Yes",
            "Ghosted",
            "Yes",
            "Yes",
            "Failed",
          ],
          [2, null, null],
          [3, "07/10/26", "Orbit", "Developer", "No", "Saved"],
        ],
      },
      {
        sheet: "Contacts",
        data: [
          [
            "#",
            "Date Added",
            "Person",
            "Company",
            "Message Sent?",
            "Follow-up 1",
            "Follow-up 2",
            "Status",
            "Notes",
          ],
          [
            1,
            46302,
            "Ali Khan",
            "Acme",
            "Yes",
            "YESSSS",
            "No",
            "Interested",
            "Hi Ali, checking in.",
          ],
          [2],
        ],
      },
      {
        sheet: "Interview Log",
        data: [
          [
            "#",
            "Date",
            "Company",
            "Role",
            "Stage",
            "Questions Asked",
            "Your Answer / What Happened",
            "Mistake",
            "Correct Answer",
            "Action Before Next Interview",
            "Result",
          ],
          [
            1,
            "08/10/26",
            "Acme",
            "React developer",
            "Technical",
            "State management?",
            "My answer",
            "Need practice",
            "Correct answer",
            "Build a Redux example",
            "Passed",
          ],
        ],
      },
      {
        sheet: "Daily Dashboard",
        data: [
          [
            "Date",
            "Applications",
            "Direct Outreach",
            "Follow-ups",
            "Network Actions",
            "Replies",
            "Screenings",
            "Interviews",
            "Rejections",
            "Offers",
            "",
            "Daily Targets",
            "",
          ],
          ["07/10/26", 10, 0, 2, 5, 3, 2, 1, 0, 0, null, "Applications", 12],
          [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "Direct Outreach",
            8,
          ],
        ],
      },
      {
        sheet: "Funnel",
        data: [
          ["JOB SEARCH FUNNEL", "", "", "", "Source Performance"],
          ["Stage", "Count"],
        ],
      },
    ],
    "2026-11-04",
  );
  assert.deepEqual(result.errors, []);
  assert.equal(result.bundle.applications.length, 2);
  assert.equal(result.bundle.applications[0].screening, "Yes");
  assert.equal(result.bundle.applications[0].interview, "Yes");
  assert.equal(result.bundle.applications[0].result, "Failed");
  assert.equal(result.bundle.applications[1].status, "Saved");
  assert.equal(result.bundle.applications[1].applied, false);
  assert.equal(result.bundle.contacts.length, 1);
  assert.equal(result.bundle.contacts[0].messaged_on, "2026-10-07");
  assert.equal(result.bundle.contacts[0].followup1_on, "2026-11-04");
  assert.equal(result.bundle.contacts[0].followup2_on, null);
  assert.equal(result.bundle.contacts[0].message_draft, "Hi Ali, checking in.");
  assert.equal(
    result.bundle.interviews[0].next_action,
    "Build a Redux example",
  );
  assert.equal(result.bundle.daily_logs.length, 1);
  assert.equal(result.bundle.daily_logs[0].direct_outreach, 0);
  assert.equal(result.bundle.daily_targets?.applications, 12);
  assert.equal(result.bundle.daily_targets?.direct_outreach, 8);
});
test("sheet-specific CSV imports and validation errors are explicit", () => {
  const contacts = parseTrackerCsv(
    "Date Added,Person,Company,Message Sent?\n04/11/26,Ali,Acme,Yes",
  );
  assert.deepEqual(contacts.errors, []);
  assert.equal(contacts.bundle.contacts[0].person, "Ali");
  assert.ok(
    parseTrackerSheets([{ sheet: "Other", data: [["Random"], ["data"]] }])
      .errors.length,
  );
  const bad = parseTrackerSheets([
    {
      sheet: "Interviews",
      data: [
        ["Date", "Company", "Stage", "Questions Asked", "Result"],
        ["31/02/26", "Acme", "Technical", "Q", "Passed"],
        ["04/11/26", "Acme", "Unknown", "Q", "Unknown"],
      ],
    },
  ]);
  assert.equal(bad.errors.length, 3);
  const logs = parseTrackerSheets([
    {
      sheet: "Daily",
      data: [
        ["Date", "Applications", "Network Actions"],
        ["04/11/26", -1, 0],
        ["04/11/26", 2, 0],
        ["05/11/26", 1.5, 0],
      ],
    },
  ]);
  assert.equal(logs.errors.length, 3);
});
test("cumulative application funnel retains historical stages and never mixes in outreach", () => {
  const apps = [
    application({
      id: "1",
      status: "Rejected",
      screening: "Yes",
      interview: "Yes",
      result: "Failed",
    }),
    application({ id: "2", status: "Offer" }),
    application({ id: "3", status: "Contacted", response: "No Reply" }),
    application({ id: "4", status: "Saved", applied: false, result: "Offer" }),
  ];
  const stages = funnelMetrics(apps);
  assert.deepEqual(
    stages.map((s) => s.count),
    [3, 2, 2, 2, 1],
  );
  stages.forEach((s) =>
    assert.ok(s.rate === null || (s.rate >= 0 && s.rate <= 1)),
  );
  assert.equal(funnelMetrics([])[1].rate, null);
  assert.deepEqual(
    sourceMetrics(apps.map((a) => ({ ...a, source: "Referral" })))[0],
    {
      source: "Referral",
      applications: 3,
      replies: 2,
      interviews: 2,
      offers: 1,
    },
  );
});
test("daily manual totals override derived counts, including an intentional zero", () => {
  const apps = [
    application({ applied_on: "2026-11-04", followup1_on: "2026-11-04" }),
  ];
  const people = [
    contact({
      messaged: true,
      messaged_on: "2026-11-04",
      followup2_on: "2026-11-04",
    }),
  ];
  const automatic = dailyMetrics("2026-11-04", apps, people, []);
  assert.equal(automatic.applications, 1);
  assert.equal(automatic.direct_outreach, 1);
  assert.equal(automatic.followups, 2);
  assert.equal(automatic.replies, 0);
  const log: DailyLog = {
    ...emptyDailyLog("2026-11-04"),
    id: "log",
    user_id: "owner",
    created_at: "",
    applications: 10,
    direct_outreach: 0,
    network_actions: 5,
    replies: 2,
  };
  const values = dailyMetrics("2026-11-04", apps, people, [log]);
  assert.equal(values.applications, 10);
  assert.equal(values.direct_outreach, 0);
  assert.equal(values.followups, 2);
  assert.equal(values.network_actions, 5);
});
test("contact reminders respect timing and closed contacts; withdrawn applications stop follow-ups", () => {
  assert.equal(contactNextStep(contact(), "2026-11-04")?.kind, "first_message");
  assert.equal(
    contactNextStep(
      contact({ messaged: true, messaged_on: "2026-11-02" }),
      "2026-11-04",
    ),
    null,
  );
  assert.equal(
    contactNextStep(
      contact({ messaged: true, messaged_on: "2026-11-01" }),
      "2026-11-04",
    )?.overdue,
    0,
  );
  assert.equal(
    contactNextStep(
      contact({ messaged: true, followup1_on: "2026-10-31" }),
      "2026-11-04",
    )?.kind,
    "followup2",
  );
  assert.equal(
    contactNextStep(contact({ status: "Closed" }), "2026-11-04"),
    null,
  );
  assert.equal(
    isDue(
      application({ status: "Withdrawn", contact_name: "Ali" }),
      "first_message",
      "2026-11-04",
    ),
    false,
  );
});
test("duplicate detection is conservative and checks duplicates inside the same file", () => {
  const app = application({
    company: "  ACME ",
    role: "React Developer",
    applied_on: "2026-11-04",
  });
  const bundle = {
    ...emptyBundle(),
    applications: [
      {
        ...emptyApplication(),
        company: "acme",
        role: "React Developer",
        applied_on: "2026-11-04",
      },
      { ...emptyApplication(), company: "Other", applied_on: "2026-11-04" },
      { ...emptyApplication(), company: "other", applied_on: "2026-11-04" },
    ],
  };
  const result = deduplicateBundle(bundle, {
    applications: [app],
    contacts: [],
    interviews: [],
  });
  assert.equal(result.skipped, 2);
  assert.equal(result.bundle.applications.length, 1);
});
test("CSV export retains added milestone fields and prevents spreadsheet formula execution", () => {
  const app = application({
    company: "Acme",
    screening: "Passed",
    interview: "Yes",
    result: "Offer",
    notes: "First line\nSecond line",
  });
  const result = parseTrackerCsv(applicationCsv([app]), "2026-11-04");
  assert.deepEqual(result.errors, []);
  assert.equal(result.bundle.applications[0].screening, "Passed");
  assert.equal(result.bundle.applications[0].notes, app.notes);
  assert.match(
    applicationCsv([application({ company: "=SUM(A1:A2)" })]),
    /'=SUM/,
  );
});
