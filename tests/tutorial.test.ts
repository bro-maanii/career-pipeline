import test from "node:test";
import assert from "node:assert/strict";
import {
  LANDING_TUTORIAL,
  WORKSPACE_TUTORIAL,
  parseTutorialProgress,
  spotlightBox,
  tutorialPanelPosition,
  tutorialStorageKey,
} from "../src/lib/tutorial";

test("tutorial progress stays separate for visitors and each account", () => {
  assert.notEqual(
    tutorialStorageKey("workspace", "account-a"),
    tutorialStorageKey("workspace", "account-b"),
  );
  assert.notEqual(
    tutorialStorageKey("landing"),
    tutorialStorageKey("workspace", "account-a"),
  );
  assert.throws(() => tutorialStorageKey("workspace"));
  const value = {
    version: 1,
    index: 3,
    language: "roman",
    status: "in_progress",
  };
  assert.deepEqual(parseTutorialProgress(JSON.stringify(value), 22), value);
  for (const invalid of [
    null,
    "not json",
    "null",
    JSON.stringify({ ...value, version: 2 }),
    JSON.stringify({ ...value, index: -1 }),
    JSON.stringify({ ...value, index: 22 }),
    JSON.stringify({ ...value, index: 1.5 }),
    JSON.stringify({ ...value, language: "other" }),
    JSON.stringify({ ...value, status: "unknown" }),
  ]) {
    assert.equal(parseTutorialProgress(invalid, 22), null);
  }
});

test("spotlight clips large or partly visible controls and ignores invisible targets", () => {
  const viewport = { width: 390, height: 844 };
  assert.deepEqual(
    spotlightBox({ left: -20, top: -30, width: 900, height: 1000 }, viewport),
    { left: 8, top: 8, width: 374, height: 828 },
  );
  assert.deepEqual(
    spotlightBox({ left: 25, top: 50, width: 100, height: 40 }, viewport),
    { left: 17, top: 42, width: 116, height: 56 },
  );
  assert.equal(
    spotlightBox({ left: 20, top: 900, width: 100, height: 40 }, viewport),
    null,
  );
  assert.equal(
    spotlightBox({ left: 20, top: 30, width: 0, height: 40 }, viewport),
    null,
  );
  assert.equal(
    spotlightBox(
      { left: Number.NaN, top: 30, width: 100, height: 40 },
      viewport,
    ),
    null,
  );
});

test("tour panels fit mobile, short landscapes, and desktop edge targets", () => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 1440, height: 900 },
  ]) {
    for (const target of [
      null,
      { left: 8, top: 8, width: 100, height: 50 },
      {
        left: viewport.width - 150,
        top: viewport.height - 80,
        width: 140,
        height: 70,
      },
      {
        left: 8,
        top: 8,
        width: viewport.width - 16,
        height: viewport.height - 16,
      },
    ]) {
      const panel = tutorialPanelPosition(target, viewport, {
        width: 370,
        height: 450,
      });
      assert.ok(panel.left >= 12 && panel.top >= 12);
      assert.ok(panel.left + panel.width <= viewport.width - 12);
      assert.ok(panel.top + panel.height <= viewport.height - 12);
    }
  }
  const mobile = tutorialPanelPosition(
    { left: 30, top: 30, width: 100, height: 40 },
    { width: 390, height: 844 },
    { width: 370, height: 350 },
  );
  assert.equal(mobile.top, 482);
});

test("workspace tour covers all seven routes with bilingual explanations and safe fallback targets", () => {
  assert.deepEqual(
    new Set(WORKSPACE_TUTORIAL.map((step) => step.path)),
    new Set([
      "/today",
      "/applications",
      "/contacts",
      "/interviews",
      "/activity",
      "/funnel",
      "/templates",
    ]),
  );
  for (const steps of [WORKSPACE_TUTORIAL, LANDING_TUTORIAL]) {
    assert.equal(new Set(steps.map((step) => step.id)).size, steps.length);
    for (const step of steps) {
      assert.ok(step.title && step.description && step.roman);
      assert.match(step.target, /^[a-z0-9_-]+$/);
      if (steps === WORKSPACE_TUTORIAL) assert.match(step.fallback!, /^nav-/);
      else assert.equal(step.path, "/");
    }
  }
});
