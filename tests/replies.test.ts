import test from "node:test";
import assert from "node:assert/strict";
import { emptyApplication } from "../src/lib/csv";
import { emptyContact, contactNextStep, stagesFor } from "../src/lib/tracker";
import { isDue } from "../src/lib/followups";
import {
  applicationReplyUpdate,
  contactReplyUpdate,
  redirectedContact,
} from "../src/lib/replies";
import type { Application, Contact } from "../src/lib/types";
const application = (values: Partial<Application> = {}): Application => ({
  ...emptyApplication(),
  id: "app",
  user_id: "owner",
  created_at: "2026-11-01T00:00:00Z",
  contact_name: "Ali Khan",
  messaged: true,
  messaged_on: "2026-11-01",
  status: "Contacted",
  ...values,
});
const contact = (values: Partial<Contact> = {}): Contact => ({
  ...emptyContact(),
  id: "contact",
  user_id: "owner",
  created_at: "2026-11-01T00:00:00Z",
  person: "Sara",
  messaged: true,
  messaged_on: "2026-11-01",
  status: "Messaged",
  ...values,
});
const TODAY = "2026-11-10";
const apply = (app: Application, update: Partial<Application>) => ({
  ...app,
  ...update,
});

test("a progressing reply stops follow-ups and counts as a reply", () => {
  const app = application();
  const next = apply(
    app,
    applicationReplyUpdate(app, "followup1", "progress", "", TODAY),
  );
  assert.equal(next.status, "Replied");
  assert.equal(isDue(next, "followup1", "2026-11-20"), false);
  assert.equal(stagesFor(next).replied, true);
});

test("a referral keeps chasing and restarts the clock from today", () => {
  const app = application();
  const next = apply(
    app,
    applicationReplyUpdate(app, "followup1", "referred", "Referred you", TODAY),
  );
  assert.equal(next.status, "Contacted");
  assert.equal(next.response, "Referred you");
  assert.equal(next.messaged_on, TODAY);
  assert.equal(isDue(next, "followup1", "2026-11-12"), false);
  assert.equal(isDue(next, "followup1", "2026-11-13"), true);
  assert.equal(stagesFor(next).replied, true);

  const second = application({ followup1_on: "2026-11-04" });
  const after = apply(
    second,
    applicationReplyUpdate(second, "followup2", "referred", "", TODAY),
  );
  assert.equal(after.messaged_on, "2026-11-01");
  assert.equal(after.followup1_on, TODAY);
  assert.equal(after.response, "Referred me");
  assert.equal(isDue(after, "followup2", "2026-11-14"), true);
});

test("a decline closes the application; a redirect stops chasing the first person", () => {
  const app = application();
  assert.equal(
    applicationReplyUpdate(app, "followup1", "declined", "", TODAY).status,
    "Rejected",
  );
  assert.equal(
    applicationReplyUpdate(app, "followup1", "redirect", "", TODAY).status,
    "Replied",
  );
});

test("a redirect creates a fresh first-message contact with context", () => {
  const created = redirectedContact(
    { person: " Hina Ahmed ", role: "HR", linkedin_url: "" },
    {
      name: "Ali Khan",
      company: "Acme",
      role: "React Developer",
      text: "Please contact HR",
    },
    TODAY,
  );
  assert.equal(created.person, "Hina Ahmed");
  assert.equal(created.company, "Acme");
  assert.equal(created.status, "Not Contacted");
  assert.equal(created.messaged, false);
  assert.equal(created.added_on, TODAY);
  assert.match(created.why_targeted || "", /Ali Khan suggested/);
  assert.match(created.why_targeted || "", /Please contact HR/);
  assert.match(created.message_draft || "", /^Hi Hina, Ali suggested/);
  assert.match(created.message_draft || "", /React Developer role at Acme/);
  const asRow: Contact = { ...created, id: "n", user_id: "o", created_at: "" };
  assert.equal(contactNextStep(asRow, TODAY)?.kind, "first_message");
});

test("contact replies: referral restarts follow-ups, others stop them", () => {
  const person = contact();
  const referred = {
    ...person,
    ...contactReplyUpdate(person, "followup1", "referred", "", TODAY),
  };
  assert.equal(referred.status, "Messaged");
  assert.equal(referred.reply, "Referred me");
  assert.equal(contactNextStep(referred, "2026-11-12"), null);
  assert.equal(contactNextStep(referred, "2026-11-13")?.kind, "followup1");
  for (const [outcome, status] of [
    ["progress", "Replied"],
    ["redirect", "Replied"],
    ["declined", "Closed"],
  ] as const) {
    const next = {
      ...person,
      ...contactReplyUpdate(person, "followup1", outcome, "", TODAY),
    };
    assert.equal(next.status, status);
    assert.equal(contactNextStep(next, "2026-11-30"), null);
  }
});
