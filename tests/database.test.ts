import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { emptyApplication } from "../src/lib/csv";
import {
  emptyBundle,
  emptyContact,
  emptyDailyLog,
  emptyInterview,
} from "../src/lib/tracker";
const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
test("database migration, owner isolation, and atomic workbook imports", async (t) => {
  const db = await PGlite.create();
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon;
      insert into auth.users (id) values ('${OWNER}');`);
    const schema = await readFile(
      new URL("../supabase/schema.sql", import.meta.url),
      "utf8",
    );
    const [original] = schema.split("-- Extended workbook workspace");
    await db.exec(original);
    const oldId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    await db.query(
      "insert into public.applications (id, user_id, company) values ($1, $2, 'Before upgrade')",
      [oldId, OWNER],
    );
    const migration = await readFile(
      new URL(
        "../supabase/migrations/20261104_workbook_workspace.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await db.exec(migration);
    await t.test(
      "existing records survive and schema can run again",
      async () => {
        await db.exec(schema);
        const row = await db.query<{
          company: string;
          screening: string | null;
        }>("select company, screening from public.applications where id = $1", [
          oldId,
        ]);
        assert.equal(row.rows[0].company, "Before upgrade");
        assert.equal(row.rows[0].screening, null);
        await db.query("insert into auth.users (id) values ($1)", [OTHER]);
        const templates = await db.query<{ user_id: string; count: number }>(
          "select user_id, count(*)::int as count from public.templates group by user_id",
        );
        assert.equal(templates.rows.length, 2);
        templates.rows.forEach((row) => assert.equal(row.count, 3));
      },
    );
    async function asUser(id: string) {
      await db.exec("reset role; set role authenticated;");
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
        id,
      ]);
    }
    await asUser(OWNER);
    const bundle = {
      ...emptyBundle(),
      applications: [
        {
          ...emptyApplication(),
          company: "Acme",
          status: "Saved" as const,
          screening: "Yes",
          interview: "Yes",
          result: "Failed",
        },
      ],
      contacts: [{ ...emptyContact(), person: "Ali", company: "Acme" }],
      interviews: [
        {
          ...emptyInterview(),
          company: "Acme",
          questions: "Hooks?",
          next_action: "Practice reducer patterns",
        },
      ],
      daily_logs: [
        { ...emptyDailyLog("2026-11-04"), applications: 0, network_actions: 5 },
      ],
      daily_targets: {
        applications: 12,
        direct_outreach: 8,
        followups: 5,
        network_actions: 5,
      },
    };
    await t.test(
      "import fills every table and ignores supplied record owners",
      async () => {
        const payload = {
          ...bundle,
          applications: bundle.applications.map((row) => ({
            ...row,
            user_id: OTHER,
            id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          })),
        };
        await db.query("select public.import_tracker_bundle($1::jsonb)", [
          JSON.stringify(payload),
        ]);
        const rows = await db.query<{
          user_id: string;
          screening: string;
          status: string;
        }>(
          "select user_id, screening, status from public.applications where company = 'Acme'",
        );
        assert.equal(rows.rows[0].user_id, OWNER);
        assert.equal(rows.rows[0].screening, "Yes");
        assert.equal(rows.rows[0].status, "Saved");
        for (const table of [
          "contacts",
          "interviews",
          "daily_logs",
          "settings",
        ]) {
          const count = await db.query<{ count: number }>(
            `select count(*)::int as count from public.${table}`,
          );
          assert.equal(count.rows[0].count, 1);
        }
      },
    );
    await t.test(
      "daily log imports replace totals without adding a duplicate day",
      async () => {
        const daily = {
          ...emptyBundle(),
          daily_logs: [
            {
              ...emptyDailyLog("2026-11-04"),
              applications: 7,
              direct_outreach: 0,
            },
          ],
        };
        await db.query("select public.import_tracker_bundle($1::jsonb)", [
          JSON.stringify(daily),
        ]);
        const rows = await db.query<{
          applications: number;
          direct_outreach: number;
        }>("select applications, direct_outreach from public.daily_logs");
        assert.equal(rows.rows.length, 1);
        assert.equal(rows.rows[0].applications, 7);
        assert.equal(rows.rows[0].direct_outreach, 0);
      },
    );
    await t.test(
      "one invalid sheet rolls back all preceding inserts",
      async () => {
        const bad = {
          ...bundle,
          applications: [{ ...emptyApplication(), company: "Must roll back" }],
          interviews: [
            {
              ...emptyInterview(),
              company: "Invalid date",
              scheduled_on: null,
            },
          ],
        };
        await assert.rejects(
          db.query("select public.import_tracker_bundle($1::jsonb)", [
            JSON.stringify(bad),
          ]),
        );
        const rows = await db.query<{ count: number }>(
          "select count(*)::int as count from public.applications where company = 'Must roll back'",
        );
        assert.equal(rows.rows[0].count, 0);
      },
    );
    await t.test(
      "users cannot read or modify another user's rows in any table",
      async () => {
        await asUser(OTHER);
        for (const table of [
          "applications",
          "contacts",
          "interviews",
          "daily_logs",
          "settings",
        ]) {
          const rows = await db.query(`select * from public.${table}`);
          assert.equal(rows.rows.length, 0);
        }
        await assert.rejects(
          db.query(
            "insert into public.contacts (user_id, person) values ($1, 'Spoofed')",
            [OWNER],
          ),
        );
        await assert.rejects(
          db.query(
            "insert into public.daily_logs (user_id, activity_on) values ($1, '2026-11-04')",
            [OWNER],
          ),
        );
        const changed = await db.query(
          "update public.applications set company = 'Stolen' where id = $1 returning id",
          [oldId],
        );
        assert.equal(changed.rows.length, 0);
        await db.query(
          "insert into public.applications (company) values ('Other account')",
        );
        const foreign = await db.query<{ id: string }>(
          "select id from public.applications where company = 'Other account'",
        );
        await asUser(OWNER);
        await assert.rejects(
          db.query(
            "insert into public.interviews (application_id, company, scheduled_on) values ($1, 'Wrong account', '2026-11-04')",
            [foreign.rows[0].id],
          ),
        );
      },
    );
    await t.test(
      "all six tables block cross-account reads, writes, deletes, and owner reassignment",
      async () => {
        const tables = [
          "applications",
          "templates",
          "contacts",
          "interviews",
          "daily_logs",
          "settings",
        ];
        for (const table of tables) {
          await asUser(OWNER);
          const primaryKey = table === "settings" ? "user_id" : "id";
          const own = await db.query<{ record_id: string }>(
            `select ${primaryKey}::text as record_id from public.${table} where user_id = $1 limit 1`,
            [OWNER],
          );
          assert.equal(
            own.rows.length,
            1,
            `${table}: owner fixture must exist`,
          );
          const recordId = own.rows[0].record_id;
          await asUser(OTHER);
          const read = await db.query(
            `select * from public.${table} where ${primaryKey} = $1`,
            [recordId],
          );
          assert.equal(
            read.rows.length,
            0,
            `${table}: another account cannot read`,
          );
          const update = await db.query(
            `update public.${table} set user_id = user_id where ${primaryKey} = $1 returning user_id`,
            [recordId],
          );
          assert.equal(
            update.rows.length,
            0,
            `${table}: another account cannot update`,
          );
          const remove = await db.query(
            `delete from public.${table} where ${primaryKey} = $1 returning user_id`,
            [recordId],
          );
          assert.equal(
            remove.rows.length,
            0,
            `${table}: another account cannot delete`,
          );
          await asUser(OWNER);
          await assert.rejects(
            db.query(
              `update public.${table} set user_id = $1 where ${primaryKey} = $2`,
              [OTHER, recordId],
            ),
            (error: unknown) =>
              !!error &&
              typeof error === "object" &&
              "code" in error &&
              error.code === "42501",
            `${table}: ownership cannot be reassigned`,
          );
          const preserved = await db.query(
            `select * from public.${table} where ${primaryKey} = $1`,
            [recordId],
          );
          assert.equal(
            preserved.rows.length,
            1,
            `${table}: owner data is preserved`,
          );
        }
      },
    );
    await t.test(
      "each account can create, edit, and delete its own records in all six tables",
      async () => {
        await asUser(OTHER);
        const fixtures = [
          {
            table: "applications",
            insert: "company",
            value: "Own application",
            update: "role",
          },
          {
            table: "templates",
            insert: "kind, title, body",
            value: null,
            update: "body",
          },
          {
            table: "contacts",
            insert: "person",
            value: "Own contact",
            update: "notes",
          },
          {
            table: "interviews",
            insert: "company, scheduled_on",
            value: null,
            update: "answer",
          },
          {
            table: "daily_logs",
            insert: "activity_on",
            value: "2000-01-01",
            update: "notes",
          },
          {
            table: "settings",
            insert: "user_id",
            value: OTHER,
            update: "daily_targets",
          },
        ];
        for (const fixture of fixtures) {
          const primaryKey = fixture.table === "settings" ? "user_id" : "id";
          const values =
            fixture.table === "templates"
              ? ["first_message", "My own template", "Private message"]
              : fixture.table === "interviews"
                ? ["Own interview", "2000-01-01"]
                : [fixture.value];
          const inserted = await db.query<{
            record_id: string;
            user_id: string;
          }>(
            `insert into public.${fixture.table} (${fixture.insert}) values (${values.map((_, index) => `$${index + 1}`).join(",")}) returning ${primaryKey}::text as record_id, user_id`,
            values,
          );
          assert.equal(inserted.rows[0].user_id, OTHER);
          const id = inserted.rows[0].record_id;
          const nextValue =
            fixture.table === "settings"
              ? JSON.stringify({
                  applications: 2,
                  direct_outreach: 3,
                  followups: 4,
                  network_actions: 1,
                })
              : "My private update";
          const updated = await db.query(
            `update public.${fixture.table} set ${fixture.update} = $1 where ${primaryKey} = $2 returning user_id`,
            [nextValue, id],
          );
          assert.equal(
            updated.rows.length,
            1,
            `${fixture.table}: own update works`,
          );
          const deleted = await db.query(
            `delete from public.${fixture.table} where ${primaryKey} = $1 returning user_id`,
            [id],
          );
          assert.equal(
            deleted.rows.length,
            1,
            `${fixture.table}: own delete works`,
          );
        }
        await asUser(OWNER);
      },
    );
    await t.test(
      "the authenticated role alone cannot read records without a user identity",
      async () => {
        await db.query("select set_config('request.jwt.claim.sub', '', false)");
        for (const table of [
          "applications",
          "templates",
          "contacts",
          "interviews",
          "daily_logs",
          "settings",
        ]) {
          const rows = await db.query(`select * from public.${table}`);
          assert.equal(rows.rows.length, 0);
        }
        await assert.rejects(
          db.query("select public.import_tracker_bundle('{}'::jsonb)"),
          /Sign in before importing/,
        );
        await asUser(OWNER);
      },
    );
    await t.test(
      "invalid targets fail and anonymous callers cannot import",
      async () => {
        await assert.rejects(
          db.query(
            "insert into public.settings(user_id, daily_targets) values ($1, $2::jsonb) on conflict(user_id) do update set daily_targets = excluded.daily_targets",
            [
              OWNER,
              JSON.stringify({
                applications: -1,
                direct_outreach: 10,
                followups: 5,
                network_actions: 5,
              }),
            ],
          ),
        );
        await db.exec("reset role; set role anon;");
        await assert.rejects(
          db.query("select public.import_tracker_bundle('{}'::jsonb)"),
        );
        await assert.rejects(db.query("select * from public.contacts"));
      },
    );
  } finally {
    await db.close();
  }
});
