"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Send,
  Clock3,
  MessageSquare,
  Check,
  ChevronRight,
  BriefcaseBusiness,
  Reply,
  Users,
  CircleX,
} from "lucide-react";
import { useWorkspace, errorMessage } from "@/components/workspace-provider";
import { DataState } from "@/components/ui";
import { ApplicationForm } from "@/components/application-form";
import { MessageDrawer } from "@/components/message-drawer";
import { isDue, overdueDays } from "@/lib/followups";
import { FOLLOWUP_1_DAYS, FOLLOWUP_2_DAYS } from "@/lib/config";
import { DailyGoals } from "@/components/daily-goals";
import { ContactMessage } from "@/components/contact-message";
import { InterviewForm } from "@/components/tracker-forms";
import { contactNextStep, dailyMetrics, stagesFor } from "@/lib/tracker";
import { prettyDate } from "@/lib/dates";
import {
  TEMPLATE_KINDS,
  type Application,
  type TemplateKind,
  type Contact,
  type Interview,
} from "@/lib/types";
const sections = {
  first_message: {
    title: "Message nahi kiya",
    subtitle: "A connection is a good start. Say hello.",
    action: "Mark messaged",
    icon: Send,
    color: "red",
  },
  followup1: {
    title: "Follow-up 1 due",
    subtitle: `${FOLLOWUP_1_DAYS} days after your first message. Keep the conversation going.`,
    action: "Mark follow-up 1 done",
    icon: MessageSquare,
    color: "orange",
  },
  followup2: {
    title: "Follow-up 2 due",
    subtitle: `${FOLLOWUP_2_DAYS} days after your first follow-up. One more friendly check-in.`,
    action: "Mark follow-up 2 done",
    icon: Clock3,
    color: "yellow",
  },
};
export default function TodayPage() {
  const {
    applications,
    contacts,
    interviews,
    dailyLogs,
    needsMigration,
    today,
    saveApplication,
    notify,
  } = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<{
    app: Application;
    kind: TemplateKind;
  } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [outreach, setOutreach] = useState<Contact | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const outreachTasks = today
    ? contacts
        .map((contact) => ({ contact, step: contactNextStep(contact, today) }))
        .filter((item) => item.step !== null)
        .sort((a, b) => b.step!.overdue - a.step!.overdue)
    : [];
  const upcoming = today
    ? interviews
        .filter((i) => i.scheduled_on >= today && i.result === "Pending")
        .sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on))
        .slice(0, 3)
    : [];
  const queues = TEMPLATE_KINDS.map((kind) => ({
    kind,
    apps: applications
      .filter((app) => today && isDue(app, kind, today))
      .sort(
        (a, b) =>
          (overdueDays(b, kind, today) ?? -1) -
          (overdueDays(a, kind, today) ?? -1),
      ),
  }));
  const totalDue =
    queues.reduce((sum, q) => sum + q.apps.length, 0) + outreachTasks.length;
  const activity = dailyMetrics(today, applications, contacts, dailyLogs);
  const appliedToday = activity.applications;
  const followupsToday = activity.followups;
  async function mark(app: Application, kind: TemplateKind) {
    if (!today) return;
    setPending(app.id);
    try {
      await saveApplication(
        kind === "first_message"
          ? { messaged: true, messaged_on: today }
          : kind === "followup1"
            ? { followup1_on: today }
            : { followup2_on: today },
        app.id,
      );
      notify(
        kind === "first_message"
          ? "Marked as messaged. Nice work!"
          : "Follow-up marked done.",
      );
    } catch (e) {
      notify(errorMessage(e));
    } finally {
      setPending(null);
    }
  }
  return (
    <>
      <div className="page-heading" data-tour="today-overview">
        <div>
          <span className="eyebrow">
            {today
              ? new Date(`${today}T00:00:00`)
                  .toLocaleDateString(undefined, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                  .toUpperCase()
              : "YOUR DAILY CHECK-IN"}
          </span>
          <h1>
            Let’s move things forward<span className="green-period">.</span>
          </h1>
          <p>A few conversations today. New possibilities tomorrow.</p>
        </div>
        <button
          className="btn btn-primary"
          data-tour="today-add"
          onClick={() => setAdding(true)}
        >
          <Plus size={18} /> Add application
        </button>
      </div>
      <DataState>
        <section
          className="stats-strip"
          data-tour="today-stats"
          aria-label="Application statistics"
        >
          {[
            {
              label: "Total applications",
              value: applications.length,
              icon: BriefcaseBusiness,
              className: "",
            },
            {
              label: "Replied",
              value: applications.filter((a) => stagesFor(a).replied).length,
              icon: Reply,
              className: "stat-blue",
            },
            {
              label: "Interviews",
              value: applications.filter((a) => stagesFor(a).interviewed)
                .length,
              icon: Users,
              className: "stat-green",
            },
            {
              label: "Rejected",
              value: applications.filter((a) => a.status === "Rejected").length,
              icon: CircleX,
              className: "stat-gray",
            },
          ].map(({ label, value, icon: Icon, className }) => (
            <div className={`stat-item ${className}`} key={label}>
              <div>
                <span>{label}</span>
                <strong>{value.toString().padStart(2, "0")}</strong>
              </div>
              <span className="stat-icon">
                <Icon size={20} />
              </span>
            </div>
          ))}
        </section>
        {!needsMigration && <DailyGoals compact />}
        <div className="focus-heading">
          <div>
            <h2>
              Your focus today <span className="neutral-badge">{totalDue}</span>
            </h2>
            <p>Start at the top. Take it one conversation at a time.</p>
          </div>
          <div className="daily-progress">
            <span>
              <strong>{appliedToday}</strong> applications today
            </span>
            <span className="daily-divider" />
            <span>
              <strong>{followupsToday}</strong> follow-ups today
            </span>
          </div>
        </div>
        <div className="queue-list">
          {queues.map(({ kind, apps }) => {
            const section = sections[kind];
            const Icon = section.icon;
            return (
              <section
                className={`queue-section queue-${section.color}`}
                data-tour={`queue-${kind}`}
                key={kind}
              >
                <div className="queue-header">
                  <span className="queue-icon">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3>
                      {section.title}{" "}
                      <span className="count-badge">{apps.length}</span>
                    </h3>
                    <p>{section.subtitle}</p>
                  </div>
                  <span className="queue-priority">
                    {kind === "first_message"
                      ? "START HERE"
                      : kind === "followup1"
                        ? "KEEP GOING"
                        : "CHECK IN"}
                  </span>
                </div>
                {apps.length ? (
                  <div className="queue-rows">
                    {apps.map((app) => {
                      const days = overdueDays(app, kind, today);
                      return (
                        <div className="queue-row" key={app.id}>
                          <button
                            className="person-button"
                            onClick={() => setSelected({ app, kind })}
                          >
                            <span className="avatar">
                              {(app.contact_name || app.company)
                                .slice(0, 1)
                                .toUpperCase()}
                            </span>
                            <span className="person-info">
                              <strong>
                                {app.contact_name || "No contact added"}
                              </strong>
                              <span>
                                {app.company}
                                <span className="inline-dot">·</span>
                                {app.role || "Role not specified"}
                              </span>
                            </span>
                          </button>
                          <span className="due-label">
                            <Clock3 size={13} />
                            {days === null
                              ? "Date not set"
                              : kind === "first_message"
                                ? `${days}d since connection`
                                : days === 0
                                  ? "Due today"
                                  : `${days}d overdue`}
                          </span>
                          <div className="queue-actions">
                            <button
                              className="btn btn-small btn-secondary message-open"
                              onClick={() => setSelected({ app, kind })}
                            >
                              Write message <ArrowUpRight size={14} />
                            </button>
                            <button
                              className="btn btn-small btn-quiet"
                              disabled={!!pending}
                              onClick={() => void mark(app, kind)}
                            >
                              <Check size={15} />
                              {pending === app.id ? "Saving…" : section.action}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="queue-clear">
                    <Check size={17} />
                    <span>
                      {kind === "first_message"
                        ? "All caught up. New contacts will appear here."
                        : "Nothing due here. A little breathing room."}
                    </span>
                  </div>
                )}
              </section>
            );
          })}
        </div>
        {outreachTasks.length > 0 && (
          <section className="outreach-today">
            <div className="section-heading">
              <div>
                <span className="eyebrow">YOUR OTHER CONVERSATIONS</span>
                <h2>
                  Outreach to follow through{" "}
                  <span className="neutral-badge">{outreachTasks.length}</span>
                </h2>
              </div>
              <Link className="text-link" href="/contacts">
                View contacts <ChevronRight size={15} />
              </Link>
            </div>
            {outreachTasks.slice(0, 5).map(({ contact, step }) => (
              <div className="queue-row" key={contact.id}>
                <button
                  className="person-button"
                  onClick={() => setOutreach(contact)}
                >
                  <span className="avatar">{contact.person.slice(0, 1)}</span>
                  <span className="person-info">
                    <strong>{contact.person}</strong>
                    <span>
                      {contact.company || "Independent contact"} · {step!.label}
                      {step!.overdue > 0 ? ` · ${step!.overdue}d overdue` : ""}
                    </span>
                  </span>
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setOutreach(contact)}
                >
                  Write message <ArrowUpRight size={14} />
                </button>
              </div>
            ))}
          </section>
        )}
        {upcoming.length > 0 && (
          <section className="upcoming-section today-upcoming">
            <div className="section-heading">
              <h2>Next interviews</h2>
              <Link className="text-link" href="/interviews">
                Open journal <ChevronRight size={15} />
              </Link>
            </div>
            <div className="upcoming-grid">
              {upcoming.map((session) => (
                <button
                  className="upcoming-card"
                  key={session.id}
                  onClick={() => setInterview(session)}
                >
                  <Users size={19} />
                  <div>
                    <strong>{session.company}</strong>
                    <span>
                      {session.stage} · {prettyDate(session.scheduled_on)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
        <div className="dashboard-bottom">
          <span>
            <span className="workspace-dot" /> Progress is showing up, one day
            at a time.
          </span>
          <Link href="/applications">
            View all applications <ChevronRight size={16} />
          </Link>
        </div>
      </DataState>
      {adding && <ApplicationForm close={() => setAdding(false)} />}
      {outreach && (
        <ContactMessage contact={outreach} close={() => setOutreach(null)} />
      )}
      {interview && (
        <InterviewForm interview={interview} close={() => setInterview(null)} />
      )}
      {selected && (
        <MessageDrawer
          app={selected.app}
          kind={selected.kind}
          close={() => setSelected(null)}
        />
      )}
    </>
  );
}
