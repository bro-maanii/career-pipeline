"use client";
import { useWorkspace } from "@/components/workspace-provider";
import { DataState, EmptyState } from "@/components/ui";
import { funnelMetrics, sourceMetrics, dailyMetrics } from "@/lib/tracker";
const percent = (value: number | null) =>
  value === null ? "—" : `${Math.round(value * 100)}%`;
export default function FunnelPage() {
  const { applications, contacts, dailyLogs, today } = useWorkspace();
  const funnel = funnelMetrics(applications);
  const sources = sourceMetrics(applications);
  const total = funnel[0].count;
  const messaged = contacts.filter((c) => c.messaged);
  const outreachReplies = messaged.filter(
    (c) =>
      ["Replied", "Interested"].includes(c.status) ||
      (!!c.reply?.trim() &&
        !["no", "no reply", "none", "pending"].includes(
          c.reply.trim().toLowerCase(),
        )),
  ).length;
  const days = Array.from({ length: 7 }, (_, index) => {
    if (!today) return "";
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 6 + index);
    return date.toISOString().slice(0, 10);
  });
  const activity = days.map((day) => {
    const counts = dailyMetrics(day, applications, contacts, dailyLogs);
    return {
      date: day,
      count:
        counts.applications +
        counts.direct_outreach +
        counts.followups +
        counts.network_actions,
    };
  });
  const maxActivity = Math.max(1, ...activity.map((day) => day.count));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEE WHAT’S WORKING</span>
          <h1>
            Your search funnel<span className="green-period">.</span>
          </h1>
          <p>
            Understand where opportunities progress and which sources get
            responses.
          </p>
        </div>
      </div>
      <DataState extended>
        <div className="funnel-summary">
          {[
            {
              label: "Response rate",
              value: percent(total ? funnel[1].count / total : null),
            },
            {
              label: "Interview rate",
              value: percent(total ? funnel[3].count / total : null),
            },
            { label: "Offers", value: String(funnel[4].count) },
            {
              label: "Active applications",
              value: String(
                applications.filter(
                  (a) =>
                    a.applied &&
                    !["Rejected", "Ghosted", "Withdrawn", "Offer"].includes(
                      a.status,
                    ),
                ).length,
              ),
            },
          ].map((stat) => (
            <div key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
        <div className="report-grid" data-tour="funnel-report">
          <section className="report-panel">
            <div className="report-heading">
              <span className="eyebrow">APPLICATIONS ONLY</span>
              <h2>From application to offer</h2>
            </div>
            {!total ? (
              <EmptyState
                title="Your funnel starts with an application"
                description="Add or import applications to see your progress."
              />
            ) : (
              <div className="funnel-stages">
                {funnel.map((stage, index) => (
                  <div className="funnel-stage" key={stage.label}>
                    <div className="funnel-label">
                      <span>
                        <small>0{index + 1}</small>
                        {stage.label}
                      </span>
                      <strong>{stage.count}</strong>
                    </div>
                    <div className="funnel-track">
                      <div
                        style={{
                          width: `${(stage.count / total) * 100}%`,
                          opacity: 1 - index * 0.12,
                        }}
                      />
                    </div>
                    <p>
                      {index === 0
                        ? "Applications marked as applied"
                        : `${percent(stage.rate)} of ${funnel[index - 1].label.toLowerCase()}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="report-note">
              Stages are cumulative within the same application cohort.
              Screening, Interview, and Result fields retain earlier progress
              after a rejection or status change. Separate outreach contacts are
              measured below.
            </p>
          </section>
          <div className="report-stack">
            <section className="report-panel">
              <div className="report-heading">
                <span className="eyebrow">LAST 7 DAYS</span>
                <h2>Actions you took</h2>
              </div>
              <div
                className="weekly-chart"
                role="img"
                aria-label={`Actions per day: ${activity.map((day) => `${day.date}: ${day.count}`).join(", ")}`}
              >
                {activity.map((day, index) => (
                  <div className="weekly-column" key={index}>
                    <strong>{day.count}</strong>
                    <div className="weekly-bar-area">
                      <div
                        className={day.date === today ? "is-today" : ""}
                        style={{
                          height: `${(day.count / maxActivity) * 100}%`,
                        }}
                      />
                    </div>
                    <span>
                      {day.date
                        ? new Date(`${day.date}T00:00:00`).toLocaleDateString(
                            undefined,
                            { weekday: "short" },
                          )
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="report-note">
                Applications, direct outreach, follow-ups, and logged network
                actions. Manual daily totals replace automatic counts for the
                same date.
              </p>
            </section>
            <section className="report-panel outreach-report">
              <span className="eyebrow">YOUR SEPARATE OUTREACH CHANNEL</span>
              <h2>Conversations beyond job posts</h2>
              <div>
                <span>
                  <strong>{messaged.length}</strong> contacts messaged
                </span>
                <span>
                  <strong>{outreachReplies}</strong> replied
                </span>
                <span>
                  <strong>
                    {percent(
                      messaged.length
                        ? outreachReplies / messaged.length
                        : null,
                    )}
                  </strong>{" "}
                  response rate
                </span>
              </div>
            </section>
          </div>
        </div>
        <section
          className="table-panel source-report"
          data-tour="funnel-sources"
        >
          <div className="table-toolbar table-title">
            <h2>Source performance</h2>
            <span className="muted">Only applications marked as applied</span>
          </div>
          {sources.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Applications</th>
                    <th>Replies</th>
                    <th>Interviews</th>
                    <th>Offers</th>
                    <th>Response rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.source}>
                      <td>
                        <strong>{source.source}</strong>
                      </td>
                      <td>{source.applications}</td>
                      <td>{source.replies}</td>
                      <td>{source.interviews}</td>
                      <td>{source.offers}</td>
                      <td>
                        <span className="rate-cell">
                          <progress
                            max={source.applications}
                            value={source.replies}
                            aria-label={`${source.source} response rate`}
                          />
                          {percent(source.replies / source.applications)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No source data yet"
              description="Record where each application came from to compare your results."
            />
          )}
        </section>
      </DataState>
    </>
  );
}
