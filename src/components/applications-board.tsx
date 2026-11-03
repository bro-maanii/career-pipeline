"use client";
import { useState } from "react";
import { type Application, type Status, STATUSES } from "@/lib/types";
import { prettyDate } from "@/lib/dates";
const columns: { title: string; statuses: Status[]; className: string }[] = [
  { title: "Saved", statuses: ["Saved"], className: "saved" },
  {
    title: "In progress",
    statuses: ["Applied", "Contacted", "Replied"],
    className: "progress",
  },
  {
    title: "Hiring conversations",
    statuses: ["Screening", "Interview"],
    className: "interview",
  },
  { title: "Offers", statuses: ["Offer"], className: "offer" },
  {
    title: "Closed",
    statuses: ["Rejected", "Ghosted", "Withdrawn"],
    className: "closed",
  },
];
export function ApplicationsBoard({
  applications,
  edit,
  update,
  pending,
}: {
  applications: Application[];
  edit: (app: Application) => void;
  update: (app: Application, status: Status) => Promise<void>;
  pending: string | null;
}) {
  const [limit, setLimit] = useState(20);
  return (
    <div className="board-scroll">
      <div className="applications-board">
        {columns.map((column) => {
          const rows = applications.filter((app) =>
            column.statuses.includes(app.status),
          );
          return (
            <section
              className={`board-column board-${column.className}`}
              key={column.title}
            >
              <header>
                <h3>{column.title}</h3>
                <span className="neutral-badge">{rows.length}</span>
              </header>
              <div>
                {rows.slice(0, limit).map((app) => (
                  <article className="board-card" key={app.id}>
                    <button onClick={() => edit(app)}>
                      <span className="company-avatar">
                        {app.company.slice(0, 1)}
                      </span>
                      <strong>{app.company}</strong>
                      <p>{app.role || "Open role"}</p>
                    </button>
                    <div className="board-card-meta">
                      <span>
                        {app.work_type || app.location || "Location not set"}
                      </span>
                      <span>{prettyDate(app.applied_on)}</span>
                    </div>
                    {app.contact_name && (
                      <p className="board-contact">
                        {app.contact_name} ·{" "}
                        {app.messaged ? "Messaged" : "Not messaged"}
                      </p>
                    )}
                    <select
                      className={`status-select status-${app.status.toLowerCase()}`}
                      aria-label={`Move ${app.company} to status`}
                      value={app.status}
                      disabled={pending === app.id}
                      onChange={(event) =>
                        void update(app, event.target.value as Status)
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </article>
                ))}
                {!rows.length && (
                  <p className="board-empty">No opportunities here yet</p>
                )}
                {rows.length > limit && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setLimit(limit + 20)}
                  >
                    Show more
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
