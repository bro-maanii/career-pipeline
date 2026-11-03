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
import {
  TEMPLATE_KINDS,
  type Application,
  type TemplateKind,
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
  const { applications, today, saveApplication, notify } = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<{
    app: Application;
    kind: TemplateKind;
  } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
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
  const totalDue = queues.reduce((sum, q) => sum + q.apps.length, 0);
  const appliedToday = applications.filter(
    (a) => a.applied && a.applied_on === today,
  ).length;
  const followupsToday = applications.reduce(
    (sum, a) =>
      sum + Number(a.followup1_on === today) + Number(a.followup2_on === today),
    0,
  );
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
      <div className="page-heading">
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
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          <Plus size={18} /> Add application
        </button>
      </div>
      <DataState>
        <section className="stats-strip" aria-label="Application statistics">
          {[
            {
              label: "Total applications",
              value: applications.length,
              icon: BriefcaseBusiness,
              className: "",
            },
            {
              label: "Replied",
              value: applications.filter((a) => a.status === "Replied").length,
              icon: Reply,
              className: "stat-blue",
            },
            {
              label: "Interviews",
              value: applications.filter((a) => a.status === "Interview")
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
