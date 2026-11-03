"use client";
import { useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarDays,
  BookOpen,
  Upload,
} from "lucide-react";
import { useWorkspace } from "@/components/workspace-provider";
import { DataState, EmptyState } from "@/components/ui";
import { InterviewForm, DeleteRecordDialog } from "@/components/tracker-forms";
import { ImportDialog } from "@/components/import-dialog";
import {
  INTERVIEW_STAGES,
  INTERVIEW_RESULTS,
  type Interview,
} from "@/lib/types";
import { prettyDate } from "@/lib/dates";
export default function InterviewsPage() {
  const { interviews, today, deleteInterview } = useWorkspace();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [result, setResult] = useState("");
  const [limit, setLimit] = useState(20);
  const [editing, setEditing] = useState<Interview | "new" | null>(null);
  const [deleting, setDeleting] = useState<Interview | null>(null);
  const [importing, setImporting] = useState(false);
  const upcoming = interviews
    .filter((i) => i.result === "Pending" && i.scheduled_on >= today)
    .sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on))
    .slice(0, 3);
  const matches = interviews
    .filter(
      (i) =>
        (!stage || i.stage === stage) &&
        (!result || i.result === result) &&
        [i.company, i.role, i.questions, i.mistake, i.next_action].some((v) =>
          v?.toLowerCase().includes(search.toLowerCase()),
        ),
    )
    .sort((a, b) => b.scheduled_on.localeCompare(a.scheduled_on));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PREPARE, REFLECT, IMPROVE</span>
          <h1>
            Interview journal<span className="green-period">.</span>
          </h1>
          <p>
            Keep the questions, lessons, and next steps from every conversation.
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setImporting(true)}
          >
            <Upload size={17} />
            Import tracker
          </button>
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            <Plus size={17} />
            Log interview
          </button>
        </div>
      </div>
      <DataState extended>
        {upcoming.length > 0 && (
          <section className="upcoming-section">
            <h2>Coming up</h2>
            <div className="upcoming-grid">
              {upcoming.map((i) => (
                <button
                  key={i.id}
                  className="upcoming-card"
                  onClick={() => setEditing(i)}
                >
                  <CalendarDays size={20} />
                  <div>
                    <strong>{i.company}</strong>
                    <span>
                      {i.stage} · {prettyDate(i.scheduled_on)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
        <section className="table-panel" data-tour="interviews-journal">
          <div className="table-toolbar">
            <div className="filters">
              <label className="search-field">
                <Search size={17} />
                <input
                  aria-label="Search interviews"
                  placeholder="Search company, question, or lesson…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setLimit(20);
                  }}
                />
              </label>
              <select
                aria-label="Filter interview stage"
                value={stage}
                onChange={(e) => {
                  setStage(e.target.value);
                  setLimit(20);
                }}
              >
                <option value="">All stages</option>
                {INTERVIEW_STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                aria-label="Filter interview result"
                value={result}
                onChange={(e) => {
                  setResult(e.target.value);
                  setLimit(20);
                }}
              >
                <option value="">All results</option>
                {INTERVIEW_RESULTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          {!matches.length ? (
            <EmptyState
              title={
                interviews.length
                  ? "No interviews match"
                  : "Make every interview useful"
              }
              description="Log a screening or interview, capture what you learned, and prepare for the next one."
            />
          ) : (
            <div className="journal-list">
              {matches.slice(0, limit).map((i) => (
                <article className="journal-card" key={i.id}>
                  <header>
                    <span className="journal-icon">
                      <BookOpen size={20} />
                    </span>
                    <div>
                      <h2>{i.company}</h2>
                      <p>
                        {i.role || "Role not specified"} · {i.stage} ·{" "}
                        {prettyDate(i.scheduled_on)}
                        {i.interviewer && ` · ${i.interviewer}`}
                      </p>
                    </div>
                    <span
                      className={`result-badge result-${i.result.toLowerCase()}`}
                    >
                      {i.result}
                    </span>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        aria-label={`Edit interview at ${i.company}`}
                        onClick={() => setEditing(i)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-btn delete-button"
                        aria-label={`Delete interview at ${i.company}`}
                        onClick={() => setDeleting(i)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </header>
                  <div className="journal-detail">
                    {[
                      ["Questions asked", i.questions],
                      ["My answer / what happened", i.answer],
                      ["What to improve", i.mistake],
                      ["Correct answer", i.correct_answer],
                    ]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div key={label}>
                          <h3>{label}</h3>
                          <p>{value}</p>
                        </div>
                      ))}
                  </div>
                  {i.next_action ? (
                    <div className="next-action">
                      <strong>Before the next interview</strong>
                      <p>{i.next_action}</p>
                    </div>
                  ) : (
                    <button
                      className="journal-add-action"
                      onClick={() => setEditing(i)}
                    >
                      <Plus size={14} />
                      Add a lesson or preparation step
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
          <div className="table-footer">
            <span>
              {Math.min(limit, matches.length)} of {matches.length} interviews
            </span>
            {limit < matches.length && (
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setLimit(limit + 20)}
              >
                Show more
              </button>
            )}
          </div>
        </section>
      </DataState>
      {editing && (
        <InterviewForm
          interview={editing === "new" ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteRecordDialog
          title="Delete this interview?"
          description={`Remove the ${deleting.stage.toLowerCase()} interview at ${deleting.company} and its notes?`}
          remove={() => deleteInterview(deleting.id)}
          close={() => setDeleting(null)}
        />
      )}
      {importing && <ImportDialog close={() => setImporting(false)} />}
    </>
  );
}
