import Link from "next/link";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  CheckCheck,
  Clock3,
  FileText,
  Filter,
  Import,
  LayoutDashboard,
  LockKeyhole,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { TutorialButton, TutorialProvider } from "./tutorial";
import { LandingMotion, LandingMotionToggle } from "./landing-motion";

function Starburst({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m50 0 9 27 24-15-9 27 26 11-27 9 15 24-27-9-11 26-9-27-24 15 9-27L0 50l27-9-15-24 27 9Z" />
    </svg>
  );
}

function Brand() {
  return (
    <Link href="/" className="lp-brand" aria-label="Career Pipeline home">
      <span>
        <ChartNoAxesColumnIncreasing size={22} />
      </span>
      career pipeline<b>.</b>
    </Link>
  );
}

function ProductPreview() {
  return (
    <div
      className="lp-preview"
      data-tour="landing-preview"
      aria-label="Sample of the Today dashboard"
    >
      <div className="lp-browser-bar">
        <span className="lp-browser-dots">
          <i />
          <i />
          <i />
        </span>
        <span>
          <LockKeyhole size={11} /> Your private workspace
        </span>
        <span className="lp-sample">SAMPLE PREVIEW</span>
      </div>
      <div className="lp-demo-shell">
        <div className="lp-demo-sidebar" aria-hidden="true">
          <span className="lp-demo-logo">
            <ChartNoAxesColumnIncreasing size={23} />
          </span>
          {[
            LayoutDashboard,
            BriefcaseBusiness,
            Users,
            CalendarDays,
            Activity,
            Filter,
            FileText,
          ].map((Icon, i) => (
            <span key={i} className={i === 0 ? "active" : ""}>
              <Icon size={18} />
            </span>
          ))}
          <span className="lp-demo-avatar">Y</span>
        </div>
        <div className="lp-demo-main">
          <div className="lp-demo-topline">
            <span>
              MY WORKSPACE / <b>TODAY</b>
            </span>
            <span className="lp-demo-private">
              <i /> Just for you
            </span>
          </div>
          <div className="lp-demo-heading">
            <div>
              <span className="lp-mini-label">ONE SMALL STEP AT A TIME</span>
              <h2>
                Let’s move things forward<span>.</span>
              </h2>
              <p>A few conversations today. New possibilities tomorrow.</p>
            </div>
            <span className="lp-demo-add">
              <Plus size={14} />
              <span>Add application</span>
            </span>
          </div>
          <div className="lp-demo-stats">
            {[
              ["Applications", "12"],
              ["Replied", "04"],
              ["Interviews", "02"],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="lp-demo-focus">
            <strong>Your focus today</strong>
            <span>3 next steps</span>
          </div>
          <div className="lp-demo-queue">
            <div className="lp-demo-queue-title">
              <span className="lp-demo-icon peach">
                <Send size={15} />
              </span>
              <div>
                <strong>Say hello</strong>
                <small>A connection is a good start.</small>
              </div>
              <span className="lp-demo-count">1</span>
            </div>
            <div className="lp-demo-row">
              <span className="lp-company-icon">N</span>
              <div>
                <strong>Northstar Studio</strong>
                <small>Product Designer · Maya Chen</small>
              </div>
              <span className="lp-demo-action">
                Write message <ArrowUpRight size={12} />
              </span>
            </div>
          </div>
          <div className="lp-demo-queue">
            <div className="lp-demo-queue-title">
              <span className="lp-demo-icon amber">
                <MessageSquare size={15} />
              </span>
              <div>
                <strong>Follow-up 1 due</strong>
                <small>Keep the conversation going.</small>
              </div>
              <span className="lp-demo-count">2</span>
            </div>
            <div className="lp-demo-row">
              <span className="lp-company-icon lavender">B</span>
              <div>
                <strong>Bloom Labs</strong>
                <small>Frontend Developer · Alex Taylor</small>
              </div>
              <span className="lp-demo-due">
                <Clock3 size={11} /> Due today
              </span>
            </div>
          </div>
          <div className="lp-demo-foot">
            <CheckCheck size={14} /> A little progress is still progress.
          </div>
        </div>
      </div>
      <div className="lp-preview-note">
        <span>
          <span className="lp-live-dot" /> A place for your next chapter
        </span>
        <span>Fictional sample data</span>
      </div>
    </div>
  );
}

export function LandingPage({ member }: { member: boolean }) {
  const destination = member ? "/today" : "/signup";
  return (
    <TutorialProvider mode="landing" member={member}>
      <LandingMotion>
        <a href="#main-content" className="lp-skip-link">
          Skip to content
        </a>
        <header className="lp-header">
          <div className="lp-container lp-header-inner">
            <Brand />
            <nav aria-label="Website navigation">
              <a href="#features">The workspace</a>
              <a href="#how-it-works">How it works</a>
              <TutorialButton className="lp-nav-tutorial" />
            </nav>
            <div className="lp-header-actions">
              <LandingMotionToggle />
              {!member && (
                <Link className="lp-login" href="/login">
                  Log in
                </Link>
              )}
              <Link className="lp-button lp-button-small" href={destination}>
                {member ? "My workspace" : "Get started"}
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </header>
        <main id="main-content">
          <section className="lp-hero lp-container">
            <div className="lp-hero-copy" data-tour="landing-hero">
              <span className="lp-eyebrow">
                <span className="lp-live-dot" /> YOUR JOB SEARCH, WITH A LITTLE
                MORE MAIN-CHARACTER ENERGY
              </span>
              <h1 aria-label="Big career energy. Zero chaos.">
                <span className="lp-title-line">Big career</span>
                <span className="lp-title-line">
                  energy<span className="lp-title-dot">.</span>
                  <Starburst className="lp-title-star lp-sparkle-spin" />
                </span>
                <span className="lp-title-line lp-title-highlight">
                  Zero chaos.
                </span>
              </h1>
              <p>
                All the applications. All the follow-ups. One place to keep your
                next big move moving. Your job search just got its act together.
              </p>
              <div className="lp-hero-actions">
                <Link className="lp-button" href={destination}>
                  {member ? "Open my workspace" : "Let’s make moves"}
                  <ArrowRight size={18} />
                </Link>
                <TutorialButton className="lp-tour-button">
                  {member ? "Take the app tour" : "Show me around"}
                </TutorialButton>
              </div>
              <div className="lp-hero-reassurance">
                <span>
                  <Check size={14} /> Your own private account
                </span>
                <span>
                  <Check size={14} /> Bring your spreadsheet
                </span>
              </div>
            </div>
            <div className="lp-hero-product">
              <div className="lp-orbit-sticker" aria-hidden="true">
                <ArrowUpRight size={27} />
                <span>
                  YOUR NEXT
                  <br />
                  BIG THING
                </span>
              </div>
              <div className="lp-preview-caption">
                <span className="lp-caption-line" />
                <span>
                  Goodbye, 37 open tabs.
                  <br />
                  <b>Hello, game plan.</b>
                </span>
                <ArrowDown size={22} />
              </div>
              <div className="lp-preview-shell">
                <ProductPreview />
              </div>
              <div className="lp-floating-note">
                <span>
                  <Check size={16} />
                </span>
                <div>
                  <strong>Next move? Already sorted.</strong>
                  <small>You’ve got this. Seriously.</small>
                </div>
              </div>
            </div>
          </section>
          <div
            className="lp-workflow-strip"
            role="img"
            aria-label="Apply. Connect. Follow up. Make your next move."
          >
            <div className="lp-marquee-track" aria-hidden="true">
              {[0, 1].map((copy) => (
                <div className="lp-marquee-group" key={copy}>
                  <span>APPLY WITH INTENT</span>
                  <Sparkles />
                  <span>FOLLOW UP WITH CONFIDENCE</span>
                  <Sparkles />
                  <span>MAKE YOUR NEXT MOVE</span>
                  <Sparkles />
                </div>
              ))}
            </div>
          </div>
          <section id="features" className="lp-container lp-features">
            <div className="lp-section-heading">
              <div>
                <span className="lp-eyebrow">
                  THE WHOLE SEARCH. THE WHOLE PICTURE.
                </span>
                <h2>
                  Less “where was that?”
                  <br />
                  <em>More “what’s next?”</em>
                </h2>
              </div>
              <p>
                Every opportunity has a story. Keep the people, progress, and
                next steps together — without another tab to remember.
              </p>
            </div>
            <div className="lp-feature-grid">
              <article
                className="lp-feature lp-applications"
                data-tour="landing-applications"
              >
                <div className="lp-feature-copy">
                  <span className="lp-feature-label">
                    <BriefcaseBusiness size={17} /> APPLICATIONS
                  </span>
                  <h3>
                    Your opportunities.
                    <br />
                    One clear picture.
                  </h3>
                  <p>
                    From saved roles to offers, follow every stage. Switch
                    between a table and a board, find a record fast, or import
                    the tracker you already have.
                  </p>
                  <span className="lp-feature-foot">
                    <Import size={15} /> Excel & CSV import · Preview before
                    saving
                  </span>
                </div>
                <div
                  className="lp-mini-board"
                  aria-label="Sample application board"
                >
                  <div className="lp-board-heading">
                    <span>
                      <i /> Applied <b>2</b>
                    </span>
                    <span>
                      <i /> Interview <b>1</b>
                    </span>
                  </div>
                  <div className="lp-board-columns">
                    <div>
                      <div className="lp-board-card">
                        <span className="lp-company-icon">N</span>
                        <strong>Northstar Studio</strong>
                        <small>Product Designer</small>
                        <span className="lp-board-tag">Remote</span>
                      </div>
                      <div className="lp-board-card lp-board-card-muted">
                        <strong>Evergreen Co.</strong>
                        <small>UX Designer</small>
                      </div>
                    </div>
                    <div>
                      <div className="lp-board-card">
                        <span className="lp-company-icon lavender">B</span>
                        <strong>Bloom Labs</strong>
                        <small>Frontend Developer</small>
                        <span className="lp-board-tag lavender">
                          Technical round
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="lp-example-label">Illustrative sample</span>
                </div>
              </article>
              <article
                className="lp-feature lp-contacts"
                data-tour="landing-contacts"
              >
                <span className="lp-feature-label">
                  <Users size={17} /> OUTREACH & FOLLOW-UPS
                </span>
                <h3>
                  A conversation can
                  <br />
                  open a door.
                </h3>
                <p>
                  Keep recruiters, founders, and new connections close. Know who
                  to message and when to check in again.
                </p>
                <div className="lp-conversation">
                  <span className="lp-contact-avatar">MT</span>
                  <div>
                    <strong>
                      Morgan Taylor <small>· Recruiter</small>
                    </strong>
                    <p>Thanks for reaching out! Let’s find a time to talk.</p>
                    <span>
                      <CheckCheck size={13} /> Reply recorded
                    </span>
                  </div>
                </div>
              </article>
              <article
                className="lp-feature lp-interviews"
                data-tour="landing-interviews"
              >
                <span className="lp-feature-label">
                  <CalendarDays size={17} /> INTERVIEW JOURNAL
                </span>
                <h3>
                  Get a little better.
                  <br />
                  Every conversation.
                </h3>
                <p>
                  Save the questions, your answers, and what you’d do
                  differently. Turn interview notes into your next preparation
                  plan.
                </p>
                <div className="lp-journal">
                  <span>
                    <span className="lp-journal-dot" /> PREPARATION NOTE
                  </span>
                  <p>“Lead with the outcome, then explain the process.”</p>
                  <span>
                    <Check size={14} /> One thing to practice next time
                  </span>
                </div>
              </article>
              <article
                className="lp-feature lp-activity"
                data-tour="landing-activity"
              >
                <span className="lp-feature-label">
                  <Activity size={17} /> DAILY MOMENTUM
                </span>
                <h3>
                  Small actions.
                  <br />
                  Visible progress.
                </h3>
                <p>
                  Set a pace that works for you. Track applications, outreach,
                  follow-ups, and networking against your daily goals.
                </p>
                <div className="lp-goals-sample">
                  {[
                    ["Applications", "3 / 5", "60%"],
                    ["Follow-ups", "2 / 2", "100%"],
                  ].map(([label, value, width]) => (
                    <div key={label}>
                      <div>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                      <span className="lp-meter">
                        <i style={{ width }} />
                      </span>
                    </div>
                  ))}
                </div>
              </article>
              <article
                className="lp-feature lp-funnel"
                data-tour="landing-funnel"
              >
                <div className="lp-feature-copy">
                  <span className="lp-feature-label">
                    <Filter size={17} /> FUNNEL & SOURCES
                  </span>
                  <h3>
                    See what’s moving
                    <br />
                    you forward.
                  </h3>
                  <p>
                    Understand your journey from applications to offers. Compare
                    your sources and see where replies and interviews come from.
                  </p>
                </div>
                <div
                  className="lp-funnel-sample"
                  aria-label="Illustrative funnel, not actual results"
                >
                  {[
                    ["Applied", "100%"],
                    ["Replied", "75%"],
                    ["Interview", "49%"],
                    ["Offer", "25%"],
                  ].map(([label, width], i) => (
                    <div key={label}>
                      <span>{label}</span>
                      <i style={{ width, opacity: 1 - i * 0.16 }} />
                    </div>
                  ))}
                  <small>Illustrative funnel</small>
                </div>
              </article>
              <article
                className="lp-feature lp-templates"
                data-tour="landing-templates"
              >
                <div className="lp-feature-copy">
                  <span className="lp-feature-label">
                    <FileText size={17} /> MESSAGE TEMPLATES
                  </span>
                  <h3>
                    A starting point.
                    <br />
                    Still your own words.
                  </h3>
                  <p>
                    Keep first messages and follow-ups ready. Personalize, copy,
                    and send them yourself. You stay in control of every
                    conversation.
                  </p>
                </div>
                <div className="lp-template-sample">
                  <div>
                    <span className="lp-live-dot" /> FIRST MESSAGE{" "}
                    <FileText size={14} />
                  </div>
                  <p>
                    Hi <mark>{"{name}"}</mark>,<br />I came across the{" "}
                    <mark>{"{role}"}</mark> opportunity at{" "}
                    <mark>{"{company}"}</mark> and would love to connect…
                  </p>
                  <span>
                    Make it sound like you <ArrowUpRight size={14} />
                  </span>
                </div>
              </article>
            </div>
          </section>
          <section id="how-it-works" className="lp-how">
            <div className="lp-container">
              <div className="lp-section-heading">
                <div>
                  <span className="lp-eyebrow">A SIMPLE RHYTHM</span>
                  <h2>
                    From scattered
                    <br />
                    <em>to on top of it.</em>
                  </h2>
                </div>
                <TutorialButton className="lp-tour-button">
                  Walk me through it
                </TutorialButton>
              </div>
              <div className="lp-how-grid">
                {[
                  {
                    number: "01",
                    title: "Make it your workspace",
                    text: "Create an account, add your first opportunity, or bring your Excel workbook or CSV.",
                  },
                  {
                    number: "02",
                    title: "Start with Today",
                    text: "See who needs a first message, which follow-ups are due, and how your daily goals are going.",
                  },
                  {
                    number: "03",
                    title: "Keep the story moving",
                    text: "Update a status, record a reply, write an interview note. Come back knowing exactly where you left off.",
                  },
                ].map(({ number, title, text }) => (
                  <div key={number}>
                    <span>{number}</span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section
            className="lp-container lp-privacy"
            data-tour="landing-privacy"
          >
            <div className="lp-privacy-icon">
              <ShieldCheck size={33} />
            </div>
            <div>
              <span className="lp-eyebrow">
                PRIVATE WORKSPACE. BIG AMBITIONS.
              </span>
              <h2>Your search. Your workspace.</h2>
              <p>
                Your applications, contacts, and notes belong to your signed-in
                account. Each account has a separate workspace, protected by
                database access rules.
              </p>
            </div>
            <span className="lp-privacy-badge">
              <LockKeyhole size={15} /> Private by account
            </span>
          </section>
          <section className="lp-final" data-tour="landing-start">
            <div className="lp-container">
              <span className="lp-eyebrow">YOUR NEXT CHAPTER CALLED.</span>
              <h2>
                Make your
                <br />
                <em>next move.</em>
              </h2>
              <p>A little organization. A lot of possibility. Let’s go.</p>
              <Link className="lp-button lp-button-cream" href={destination}>
                {member ? "Go to my workspace" : "Create your workspace"}
                <ArrowRight size={18} />
              </Link>
              <TutorialButton className="lp-final-tour">
                {member ? "Take the app tour" : "Explore the sample first"}
              </TutorialButton>
            </div>
            <Starburst className="lp-final-sparkle" />
            <span className="lp-final-doodle" aria-hidden="true">
              ↗
            </span>
          </section>
        </main>
        <footer className="lp-footer lp-container">
          <Brand />
          <span>One step closer to your next chapter.</span>
          <div>
            <Link href={member ? "/today" : "/login"}>
              {member ? "Workspace" : "Log in"}
              <ArrowUpRight size={14} />
            </Link>
            <a href="#main-content">Back to top ↑</a>
          </div>
        </footer>
      </LandingMotion>
    </TutorialProvider>
  );
}
