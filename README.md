# Career Pipeline

A small, private job-search workspace for one person. Built with Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, and Postgres. No signup page, custom server, Docker, or heavy component library.

## 1. Supabase setup

1. Create a project at [Supabase](https://supabase.com/dashboard).
2. Open **SQL Editor**, paste all of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates both tables, owner-only row-level security policies, indexes, and default-template seeding.
3. Under **Authentication → Providers → Email**, keep email/password enabled. Under **Authentication → Sign In / Providers → User Signups**, disable **Allow new users to sign up**. Dashboard wording can vary. This app has no signup UI; disabling signups also closes the public signup API.
4. Under **Authentication → Users → Add user → Create new user**, create your email/password user and enable **Auto Confirm User**. You can create the user before or after running the SQL: both cases receive three templates.
5. Under **Project Settings → API / API Keys**, copy the project URL and **anon (public)** key. A newer **publishable** key also works in the same environment variable. Never use a service-role or secret key in this app.
6. For local development, set the Auth **Site URL** to `http://localhost:3000`. Email confirmation or password recovery flows are outside this app’s scope; use the Supabase dashboard to manage your user/password.

The schema can be rerun. Existing templates are preserved; an absent template kind receives a default when rerunning the SQL. Each row belongs to its Auth user, and RLS enforces ownership for reads, inserts, updates, and deletes. Templates are editable, so default seeding uses a database trigger rather than hardcoded client fallback data.

## 2. Run locally

Use Node.js **22 LTS or newer** and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Fill `.env.local` with your own values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

```powershell
npm run dev
```

Open [localhost:3000](http://localhost:3000) and log in. Restart the dev server after editing environment variables. Without keys, the login screen explains setup and sign-in stays disabled. All other routes redirect to login. `.env.local` is ignored by Git.

## Using the tracker

- **Today** prioritizes “Message nahi kiya,” Follow-up 1, and Follow-up 2. Click a contact or **Write message** to open an editable, personalized message. Copy it, send it yourself, then mark the step complete. Copying does not send or mark anything.
- Follow-up 1 becomes due **3 calendar days** after the message; Follow-up 2 becomes due **4 calendar days** after Follow-up 1. Change the two constants in [`src/lib/config.ts`](src/lib/config.ts). Due-today is zero days overdue. Rejected/Offer rows leave the follow-up queues; the initial-message queue follows the requested rule regardless of status.
- Today is calculated in your browser’s local timezone, refreshed every 30 seconds and when the window regains focus. Date-only arithmetic avoids daylight-saving rounding problems.
- **Applications** supports search, status/work-type/source filters, pagination, inline status changes, and full add/edit forms. Click a company to edit all fields and notes. Deletion requires confirmation.
- **Message templates** supports multiple templates per kind. `{name}` uses the contact’s first name; `{company}` and `{role}` use the application fields.
- Stats show total rows and current Replied/Interview/Rejected statuses. Daily application counts use `applied_on` plus `applied`; daily follow-ups count both follow-up completion dates.

## Import your Excel tracker

Export **Job Tracker** as **CSV UTF-8 (Comma delimited)**. Click **Import CSV**, choose the file, review the preview/count, then confirm. Up to 5 MB per file. Existing rows are not overwritten: reimporting a file creates additional rows. One database insert makes each import atomic.

| CSV header     | Field              |
| -------------- | ------------------ |
| Date           | applied_on         |
| Company        | company (required) |
| Role           | role               |
| Location       | location           |
| Type           | work_type          |
| Source         | source             |
| Job URL        | job_url            |
| Applied?       | applied            |
| Contact Person | contact_name       |
| Contact Role   | contact_role       |
| Contacted?     | messaged           |
| Follow-up 1    | followup1_on       |
| Follow-up 2    | followup2_on       |
| Status         | status             |
| Response       | response           |
| Salary         | salary             |
| Why Applied    | why_applied        |
| Notes          | notes              |

Optional **Contact LinkedIn**, **Connection Sent On**, and **Messaged On** headers are also supported. The corresponding snake_case names are accepted for those optional fields. Header matching ignores case and surrounding spaces. Quoted commas/newlines and UTF-8 BOM are supported.

- Dates accept `dd/mm/yy` (2000–2099), `dd/mm/yyyy`, `yyyy-mm-dd`, or Excel’s standard Windows **1900 date-system** serials. Excel’s fictitious serial 60 is rejected. Convert workbooks using the older Mac 1904 date system before import.
- `yes`, `YES`, `YESSSS` (any number of trailing s), `true`, and `1` count as true. No/blank is false, except a missing/blank **Applied?** defaults to true.
- A follow-up containing yes but no date receives the browser’s local date **when the file is selected**. No/false/0 follow-ups stay incomplete. Other nonempty unparseable date cells are reported as errors.
- Contacted?=Yes with no message date uses the application date. An empty connection date also uses the application date. If the application date is absent, those fallbacks stay empty: edit the record to provide a message date for follow-up scheduling.
- Empty rows are skipped. Missing company names, invalid dates, unknown statuses, or malformed CSV rows block confirmation until fixed. Blank status defaults to Applied.
- The preview shows the first 10 rows; the count covers the entire file. No records are saved before confirmation.

## Checks

```powershell
npm test
npm run lint
npm run build
```

`npm run typecheck` is also available. Tests cover CSV mappings, date formats and invalid dates, timing boundaries, closed statuses, and template placeholders. Builds and tests require no Supabase credentials. Real sign-in, database mutations, and RLS verification require your Supabase project and user.

## GitHub workflow

Repository: **career-pipeline**, private, default branch **main**. The initial implementation is pushed once. Later edits stay local for you to review and push:

```powershell
git status
git add .
git commit -m "Describe your changes"
git push origin main
```

Never stage `.env.local`. No deployment workflow is configured.

## Optional future Vercel deployment — manual only

No deployment is performed as part of this project setup.

1. In Vercel, choose **Add New → Project** and import your private `career-pipeline` GitHub repository.
2. Select the **Next.js** preset. Keep build command `npm run build` and the default output directory.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the project’s environment variables. These public values are embedded at build time, so redeploy after changing them.
4. Deploy only when you choose. Set the Supabase Auth Site URL to the resulting HTTPS URL. If you later add email flows, configure their redirect allowlist too.

## Structure

```text
src/app/(workspace)/    Protected Today, Applications, Templates routes
src/components/        Small forms, tables, message drawer, shared workspace state
src/lib/               Types, dates, follow-up rules, CSV parsing, Supabase clients
src/proxy.ts           Session refresh and redirect protection
supabase/schema.sql    Tables, RLS, owner policies, seeded templates
tests/tracker.test.ts  Core behavior tests
```
