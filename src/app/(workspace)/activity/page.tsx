"use client";
import { useState } from "react";
import { Plus, SlidersHorizontal, Pencil, Trash2, Upload } from "lucide-react";
import { useWorkspace, errorMessage } from "@/components/workspace-provider";
import { DataState, Modal } from "@/components/ui";
import { DailyGoals } from "@/components/daily-goals";
import { DeleteRecordDialog } from "@/components/tracker-forms";
import { ImportDialog } from "@/components/import-dialog";
import { dailyMetrics, emptyDailyLog, METRIC_LABELS } from "@/lib/tracker";
import {
  DAILY_METRICS,
  type DailyLog,
  type DailyLogInput,
  type DailyTargets,
} from "@/lib/types";
import { prettyDate } from "@/lib/dates";
function TargetsDialog({ close }: { close: () => void }) {
  const { targets, saveTargets, notify } = useWorkspace();
  const [values, setValues] = useState<DailyTargets>(targets);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      if (
        Object.values(values).some(
          (v) => !Number.isSafeInteger(v) || v < 0 || v > 1000000,
        )
      )
        throw new Error("Targets must be whole numbers from 0 to 1,000,000.");
      await saveTargets(values);
      notify("Daily targets updated.");
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal title="Set your daily targets" close={close} busy={pending}>
      <form onSubmit={save}>
        <fieldset className="form-fieldset" disabled={pending}>
          <div className="form-content form-stack">
            <p className="muted">
              Choose a pace you can maintain. Set a target to 0 to turn it off.
            </p>
            {(Object.keys(values) as (keyof DailyTargets)[]).map((key) => (
              <label className="field" key={key}>
                {METRIC_LABELS[key]}
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  required
                  value={values[key]}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [key]: Number(e.target.value),
                    }))
                  }
                />
              </label>
            ))}
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
          </div>
          <footer className="modal-footer">
            <button className="btn btn-secondary" type="button" onClick={close}>
              Cancel
            </button>
            <button className="btn btn-primary">
              {pending ? "Saving…" : "Save targets"}
            </button>
          </footer>
        </fieldset>
      </form>
    </Modal>
  );
}
function DailyLogDialog({ date, close }: { date: string; close: () => void }) {
  const { dailyLogs, applications, contacts, saveDailyLog, notify } =
    useWorkspace();
  const existing = dailyLogs.find((row) => row.activity_on === date);
  const [values, setValues] = useState<DailyLogInput>(() => {
    const empty = emptyDailyLog(date);
    return Object.fromEntries(
      Object.keys(empty).map((key) => [
        key,
        existing
          ? existing[key as keyof DailyLogInput]
          : empty[key as keyof DailyLogInput],
      ]),
    ) as DailyLogInput;
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const auto = dailyMetrics(values.activity_on, applications, contacts, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      if (
        DAILY_METRICS.some(
          (key) =>
            values[key] !== null &&
            (!Number.isSafeInteger(values[key]) ||
              values[key]! < 0 ||
              values[key]! > 1000000),
        )
      )
        throw new Error("Counts must be whole numbers from 0 to 1,000,000.");
      await saveDailyLog(values);
      notify("Daily activity saved.");
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal title="Record daily activity" close={close} wide busy={pending}>
      <form onSubmit={save}>
        <fieldset className="form-fieldset" disabled={pending}>
          <div className="form-content">
            <p className="muted">
              Applications, outreach messages, and follow-ups are counted from
              your records. Leave a field blank to use its automatic count.
              Enter a total to override it, including 0.
            </p>
            <div className="form-grid activity-form">
              <label className="field span-two">
                Date
                <input
                  type="date"
                  required
                  readOnly={!!existing}
                  value={values.activity_on}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      activity_on: e.target.value,
                    }))
                  }
                />
              </label>
              {DAILY_METRICS.map((key) => (
                <label className="field" key={key}>
                  {METRIC_LABELS[key]}
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="1"
                    placeholder={
                      ["applications", "direct_outreach", "followups"].includes(
                        key,
                      )
                        ? `Auto: ${auto[key]}`
                        : "0"
                    }
                    value={values[key] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [key]:
                          e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                  />
                </label>
              ))}
              <label className="field span-two">
                Notes
                <textarea
                  rows={3}
                  value={values.notes || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </label>
            </div>
            <p className="field-hint">
              Replies and hiring outcomes are logged manually here because
              application statuses do not record when those events happened.
              Saved totals replace automatic counts for that date; they are
              never added twice.
            </p>
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
          </div>
          <footer className="modal-footer">
            <button className="btn btn-secondary" type="button" onClick={close}>
              Cancel
            </button>
            <button className="btn btn-primary">
              {pending ? "Saving…" : "Save daily activity"}
            </button>
          </footer>
        </fieldset>
      </form>
    </Modal>
  );
}
export default function ActivityPage() {
  const { today, applications, contacts, dailyLogs, deleteDailyLog } =
    useWorkspace();
  const [date, setDate] = useState<string | null>(null);
  const [targetEditor, setTargetEditor] = useState(false);
  const [deleting, setDeleting] = useState<DailyLog | null>(null);
  const [importing, setImporting] = useState(false);
  const [limit, setLimit] = useState(30);
  const dates = [
    ...new Set(
      [
        today,
        ...dailyLogs.map((l) => l.activity_on),
        ...applications.filter((a) => a.applied).map((a) => a.applied_on),
        ...contacts.filter((c) => c.messaged).map((c) => c.messaged_on),
        ...[...applications, ...contacts].flatMap((a) => [
          a.followup1_on,
          a.followup2_on,
        ]),
      ].filter((v): v is string => !!v),
    ),
  ]
    .sort()
    .reverse();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A STEADY PACE FOR YOUR SEARCH</span>
          <h1>
            Daily activity<span className="green-period">.</span>
          </h1>
          <p>
            See what you did, record the rest, and keep your targets realistic.
          </p>
        </div>
        <div className="heading-actions" data-tour="activity-controls">
          <button
            className="btn btn-secondary"
            onClick={() => setTargetEditor(true)}
          >
            <SlidersHorizontal size={17} />
            Targets
          </button>
          <button
            className="btn btn-primary"
            disabled={!today}
            onClick={() => setDate(today)}
          >
            <Plus size={17} />
            Log activity
          </button>
        </div>
      </div>
      <DataState extended>
        <DailyGoals />
        <section
          className="table-panel activity-history"
          data-tour="activity-history"
        >
          <div className="table-toolbar table-title">
            <h2>Activity history</h2>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setImporting(true)}
            >
              <Upload size={15} />
              Import tracker
            </button>
          </div>
          <div className="table-scroll">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Date</th>
                  {DAILY_METRICS.map((key) => (
                    <th key={key}>{METRIC_LABELS[key]}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dates.slice(0, limit).map((day) => {
                  const metrics = dailyMetrics(
                    day,
                    applications,
                    contacts,
                    dailyLogs,
                  );
                  const log = dailyLogs.find((row) => row.activity_on === day);
                  return (
                    <tr key={day}>
                      <td className="nowrap">
                        <strong>{prettyDate(day)}</strong>
                        <small>
                          {day === today
                            ? "Today"
                            : log
                              ? "Logged totals"
                              : "Automatic"}
                        </small>
                        {log?.notes && (
                          <small title={log.notes} className="table-clamp">
                            {log.notes}
                          </small>
                        )}
                      </td>
                      {DAILY_METRICS.map((key) => (
                        <td className="number-cell" key={key}>
                          {metrics[key]}
                        </td>
                      ))}
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-btn"
                            onClick={() => setDate(day)}
                            aria-label={`Edit activity for ${day}`}
                          >
                            <Pencil size={16} />
                          </button>
                          {log && (
                            <button
                              className="icon-btn delete-button"
                              onClick={() => setDeleting(log)}
                              aria-label={`Clear logged totals for ${day}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              {Math.min(dates.length, limit)} of {dates.length} dates
            </span>
            {dates.length > limit && (
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setLimit(limit + 30)}
              >
                Show more
              </button>
            )}
          </div>
        </section>
      </DataState>
      {date && <DailyLogDialog date={date} close={() => setDate(null)} />}
      {targetEditor && <TargetsDialog close={() => setTargetEditor(false)} />}
      {deleting && (
        <DeleteRecordDialog
          title="Clear logged totals?"
          description={`Remove the manual totals and notes for ${prettyDate(deleting.activity_on)}? Automatic counts from your applications and contacts will still appear.`}
          close={() => setDeleting(null)}
          remove={() => deleteDailyLog(deleting.id)}
        />
      )}
      {importing && <ImportDialog close={() => setImporting(false)} />}
    </>
  );
}
