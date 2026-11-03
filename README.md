# Career Pipeline

A job-search tracker with a separate private workspace for every account. Built with Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, and Postgres. Includes email/password signup and login, without a custom server, Docker, or heavy component library.

The workspace follows the Excel tracker’s full workflow: applications, separate outreach contacts, interview notes, daily activity and targets, and funnel/source reporting. Changes after the initial GitHub push stay local for you to review and push yourself.

## Upgrade an existing Supabase project

If you already ran the original schema, run [`supabase/migrations/20261104_workbook_workspace.sql`](supabase/migrations/20261104_workbook_workspace.sql) in the Supabase SQL Editor, then refresh the app. It preserves existing applications/templates and adds the new fields, tables, owner-only RLS policies, and atomic import function. New projects can run the complete `schema.sql` below instead. Both files can be rerun.

## 1. Supabase setup

1. Create a project at [Supabase](https://supabase.com/dashboard).
2. Open **SQL Editor**, paste all of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all six tables (`applications`, `templates`, `contacts`, `interviews`, `daily_logs`, `settings`), owner-only row-level security policies, indexes, default-template seeding, and the import function.
3. Under **Authentication → Providers → Email**, enable email/password and **Allow new users to sign up**. Keep **Confirm email** enabled. Anonymous sign-ins are not needed. Dashboard wording can vary.
4. Create an account at `/signup`, then confirm your email. Each new Auth user automatically receives three independent default templates. Existing accounts can keep signing in. You can also create a user manually through **Authentication → Users** if needed.
5. Under **Project Settings → API / API Keys**, copy the project URL and **anon (public)** key. A newer **publishable** key also works in the same environment variable. Never use a service-role or secret key in this app.
6. Under **Authentication → URL Configuration**, set **Site URL** to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to **Redirect URLs**. Use the same hostname when opening the app and the confirmation email. Password recovery remains managed through the Supabase dashboard.
7. For signups by people outside your Supabase organization, configure [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp). Supabase’s built-in sender only delivers to organization team addresses and has restrictive rate limits. Keep email confirmation enabled; test delivery to an address you control before inviting people.

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

Open [localhost:3000](http://localhost:3000) for the public landing page, then sign in or create an account. Signed-in users enter the dashboard at `/today`. Restart the dev server after editing environment variables. Without keys, auth screens explain setup and submissions stay disabled. `/`, `/login`, `/signup`, and email confirmation endpoints are public; workspace pages and the import API require authentication. `.env.local` is ignored by Git.

## Landing page and guided tutorial

The landing page introduces each workflow with clearly labeled fictional examples, a lavender/purple poster theme, acid-yellow/coral accents, and GSAP entrance, floating, marquee, and scroll-reveal animations. Use the header's **Motion** button to pause/play. OS reduced-motion settings keep the page static. GSAP loads only on the landing route, and its contexts clean up when leaving the page. Opening the tutorial stops/reverts the motion so targets remain visible and aligned. Implementation follows the [GSAP matchMedia cleanup guidance](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/).

**Tutorial** or **Show me around** launches a sample tour for visitors. For a signed-in visitor, the tutorial opens the real workspace at `/today?tour=start`.

Every workspace page has a **Tutorial** button, including on mobile. The 22-step guide visits all seven sections, scrolls the current control into view, highlights it, and explains how to use it. Choose English or Roman Urdu. Use **Next**, **Back**, **Skip step**, **Skip all**, **Restart**, or Escape; completion also offers replay. Arrow keys move between steps. The modal traps keyboard focus and prevents background actions while explaining controls. The tutorial makes no database changes.

In-progress steps and language are saved locally in the browser, separately per account. An interrupted guide resumes when reopened; a skipped or completed guide starts again. The tutorial does not launch automatically for ordinary visits. No SQL migration is needed for the landing page or tutorial.

## Private accounts and email confirmation

Each authenticated account is its own tenant. All six tables bind records to `user_id`, and database RLS policies compare that owner to `auth.uid()` for reads and writes. The app also scopes queries to the verified user. Applications, contacts, interviews, daily activity, targets, and templates are private to that account. Creating a new account starts an empty tracker with only the three default message templates; it does not copy another account’s records.

The workspace is keyed by user ID and clears visible data when a session ends or another tab switches accounts. Workbook imports also verify the account on the server against the account that opened the preview, so an account switch cannot send the old preview into a different workspace. No service-role key is used by the browser or import endpoint.

Signup requires matching passwords of at least eight characters. With email confirmation enabled, `/signup` shows a check-your-email screen instead of opening the workspace immediately. The standard Supabase confirmation link returns through `/auth/callback`, which exchanges the PKCE code for a session. A code returned to the Site URL root is also forwarded to that public callback before login protection runs.

For confirmation links that work across browsers/devices, you can use Supabase’s [SSR email-template approach](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs): set the **Confirm signup** link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`. The `/auth/confirm` endpoint verifies that hash and establishes the session. Set Site URL correctly before changing the template. Invalid/expired confirmation links return to sign-in with a readable message. Redirect destinations are fixed to this app.

No additional SQL change is needed for signup when the existing app schema and workspace upgrade are installed: the owner policies and new-user template trigger already support multiple accounts.

## Using the tracker

- **Today** prioritizes “Message nahi kiya,” Follow-up 1, and Follow-up 2. Click a contact or **Write message** to open an editable, personalized message. Copy it, send it yourself, then mark the step complete. Copying does not send or mark anything.
- Follow-up 1 becomes due **3 calendar days** after the message; Follow-up 2 becomes due **4 calendar days** after Follow-up 1. Change the two constants in [`src/lib/config.ts`](src/lib/config.ts). Due-today is zero days overdue. Rejected/Offer rows leave the follow-up queues; the initial-message queue follows the requested rule regardless of status.
- Today is calculated in your browser’s local timezone, refreshed every 30 seconds and when the window regains focus. Date-only arithmetic avoids daylight-saving rounding problems.
- **Applications** supports search, status/work-type/source filters, pagination, inline status changes, and full add/edit forms. Click a company to edit all fields and notes. Deletion requires confirmation.
- **Message templates** supports multiple templates per kind. `{name}` uses the contact’s first name; `{company}` and `{role}` use the application fields.
- Switch between **Table** and **Board** application views. Board cards use a status dropdown to move between Saved, In progress, Hiring conversations, Offers, and Closed. **Export CSV** exports filtered applications and preserves all fields. Formula-like cells are escaped for safe opening in Excel.
- Application statuses also include **Saved**, **Contacted**, and **Withdrawn**, matching the workbook. Separate **Screening**, **Interview**, and **Result** fields preserve historical progress after a current status changes. Withdrawn applications leave all reminders.
- **Outreach contacts** is a separate channel for people you contact outside a job application. Save why you targeted them, their LinkedIn profile, message draft, replies, and follow-up history. Edit/copy a first message or follow-up, then mark it done after sending it yourself. Closed/Not Relevant contacts leave reminders.
- **Interview journal** stores stage, interviewer, questions, your answer, mistakes, corrected answers, preparation actions, and results. Entries can optionally link to an application. The journal does not automatically change the application’s status or milestone fields.
- **Daily activity** derives applications, outreach messages, and follow-ups from their record dates. Log network actions and hiring outcomes yourself. Entering a daily total overrides the automatic value for that metric/date; a blank uses the automatic count, while 0 deliberately overrides it to zero. Targets are editable and saved in Supabase. Set 0 to disable a target.
- **Funnel & sources** shows cumulative application stages, source results, a 7-day action chart, and a separate outreach response rate. Conversion ratios use the same applied-application cohort. Reaching a later stage includes earlier stages. Screening/Interview/Result retain prior progress. Outreach contacts never sit between application funnel stages.
- Today’s stats show total rows, applications that reached a reply/interview stage, and current Rejected rows. Daily counts respect saved overrides. Follow-up counts include application and outreach follow-ups.

## Import your Excel tracker

Click **Import tracker** and select the original **.xlsx** workbook, or a **CSV UTF-8** export from an individual sheet. Select the workbook rather than a Windows `.lnk` shortcut. Up to 5 MB per file. Parsing happens in your browser. Review sheet counts, example rows, duplicates, and daily-log replacements before confirming. A database transaction imports the selection atomically, so one bad sheet cannot leave a partial import.

The importer recognizes **Job Tracker**, **Contacts**, **Interview Log**, and **Daily Dashboard** by their headers. **Funnel** and **How To Use** are ignored: reports are recalculated from records. Formula-only `#` row numbers and blank rows are skipped. All interview learning fields are preserved. Each contact’s message date falls back to Date Added when Message Sent? is yes and there is no explicit Messaged On date. The workbook’s Daily Targets can optionally replace your saved targets.

Likely duplicates are skipped by default, including repeated rows inside the file. Matching uses normalized company + role + application date; person + company + added date for contacts; company + role + date + stage for interviews. Existing application/contact/interview rows stay unchanged. Uncheck the option to import another copy. Daily logs replace manual totals/notes for matching dates, with an explicit preview notice.

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
| Screening      | screening          |
| Interview      | interview          |
| Result         | result             |
| Salary         | salary             |
| Why Applied    | why_applied        |
| Notes          | notes              |

Optional **Contact LinkedIn**, **Connection Sent On**, and **Messaged On** headers are also supported. The corresponding snake_case names are accepted for those optional fields. Header matching ignores case and surrounding spaces. Quoted commas/newlines and UTF-8 BOM are supported.

- Dates accept `dd/mm/yy` (2000–2099), `dd/mm/yyyy`, `yyyy-mm-dd`, or Excel’s standard Windows **1900 date-system** serials. Excel’s fictitious serial 60 is rejected. Convert workbooks using the older Mac 1904 date system before import.
- `yes`, `YES`, `YESSSS` (any number of trailing s), `true`, and `1` count as true. No/blank is false, except a missing/blank **Applied?** defaults to true.
- A follow-up containing yes but no date receives the browser’s local date **when the file is selected**. No/false/0 follow-ups stay incomplete. Other nonempty unparseable date cells are reported as errors.
- Contacted?=Yes with no message date uses the application date. An empty connection date also uses the application date. If the application date is absent, those fallbacks stay empty: edit the record to provide a message date for follow-up scheduling.
- Empty rows are skipped. Missing required names/dates, invalid dates, unknown statuses/stages, invalid numeric counts, duplicate daily dates, and malformed CSV rows block confirmation until fixed. Blank application status defaults to Applied.
- The preview shows the first 5 rows per recognized sheet; counts cover the entire file. No records are saved before confirmation.

## Checks

```powershell
npm test
npm run lint
npm run build
```

`npm run typecheck` is also available. Tests cover workbook imports, follow-up timing, daily overrides, signup validation, and safe confirmation routing. Database tests run the actual SQL in isolated in-memory Postgres (PGlite) with a minimal Auth stand-in: they check per-user template seeds, import rollback, and cross-account protection on all six tables, including reads, edits, deletes, owner reassignment, and interview links. Own-account CRUD is tested separately. Tests run sequentially to keep memory use modest and require no credentials. Live signup/email delivery still requires your Supabase project and email configuration.

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
4. Deploy only when you choose. Set the Supabase Auth Site URL to the resulting HTTPS URL and add its `/auth/callback` URL to the redirect allowlist. Verify confirmation-email delivery with your SMTP provider.

## Structure

```text
src/app/page.tsx        Public landing page with fictional product previews
src/app/(workspace)/    Protected /today, Applications, Contacts, Interviews, Activity, Funnel, Templates routes
src/components/        Small forms, tables, message drawer, shared workspace state
src/lib/               Types, dates, follow-up rules, CSV parsing, Supabase clients
src/proxy.ts           Session refresh and redirect protection
supabase/schema.sql    Full setup, RLS, templates, atomic import
supabase/migrations/   Upgrade for an existing project
tests/                 Behavior, workbook, and database policy tests
```
