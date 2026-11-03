"use client";
import { useState } from "react";
import { Upload, FileSpreadsheet, Check } from "lucide-react";
import { Modal } from "./ui";
import { useWorkspace, errorMessage } from "./workspace-provider";
import { readTrackerFile, type ImportPreview } from "@/lib/import";
import { deduplicateBundle, emptyBundle } from "@/lib/tracker";
import { prettyDate, localToday } from "@/lib/dates";
export function ImportDialog({ close }: { close: () => void }) {
  const {
    applications,
    contacts,
    interviews,
    dailyLogs,
    importBundle,
    notify,
    needsMigration,
  } = useWorkspace();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const [pending, setPending] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importTargets, setImportTargets] = useState(true);
  const distinct = preview
    ? deduplicateBundle(preview.bundle, { applications, contacts, interviews })
    : { bundle: emptyBundle(), skipped: 0 };
  const bundle = skipDuplicates
    ? distinct.bundle
    : preview?.bundle || emptyBundle();
  const total =
    bundle.applications.length +
    bundle.contacts.length +
    bundle.interviews.length +
    bundle.daily_logs.length;
  const existingDates = bundle.daily_logs.filter((log) =>
    dailyLogs.some((existing) => existing.activity_on === log.activity_on),
  ).length;
  async function read(file?: File) {
    if (!file) return;
    setReading(true);
    setError("");
    setPreview(null);
    setFileName(file.name);
    try {
      const result = await readTrackerFile(file, localToday());
      setPreview(result);
      if (
        !Object.values(result.bundle).some(
          (value) => Array.isArray(value) && value.length,
        ) &&
        !result.errors.length
      )
        setError("This file has no tracker records.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setReading(false);
    }
  }
  async function confirm() {
    setPending(true);
    setError("");
    try {
      const payload = { ...bundle };
      if (!importTargets) delete payload.daily_targets;
      await importBundle(payload);
      notify(`${total} tracker records imported.`);
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title="Bring your whole tracker along"
      close={close}
      wide
      busy={pending || reading}
    >
      <div className="form-content">
        <p className="muted">
          Choose your Excel workbook to import applications, contacts,
          interviews, and daily activity together. CSV exports from individual
          tracker sheets work too.
        </p>
        <label className="upload-area">
          <FileSpreadsheet size={30} />
          <strong>
            {reading
              ? "Reading your tracker…"
              : fileName || "Choose an Excel workbook or CSV"}
          </strong>
          <span>.xlsx or .csv · Up to 5 MB · Preview before saving</span>
          <input
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            disabled={pending || reading}
            onChange={(event) => void read(event.target.files?.[0])}
          />
        </label>
        <p className="field-hint">
          Select the original .xlsx file rather than a Windows shortcut.
          Formula-only row numbers and blank rows are ignored. Funnel totals are
          recalculated from your records.
        </p>
        {needsMigration && (
          <div className="error-box" role="alert">
            Run the workspace upgrade SQL before importing this tracker.
          </div>
        )}
        {preview && (
          <>
            <p className="field-hint">
              Sheets recognized: {preview.sheets.join(", ") || "None"}
            </p>
            <div className="import-counts">
              {[
                ["Applications", bundle.applications.length],
                ["Contacts", bundle.contacts.length],
                ["Interviews", bundle.interviews.length],
                ["Daily logs", bundle.daily_logs.length],
              ].map(([label, count]) => (
                <div key={label}>
                  <strong>{count}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(event) => setSkipDuplicates(event.target.checked)}
                disabled={pending}
              />
              Skip {distinct.skipped} likely duplicate
              {distinct.skipped === 1 ? "" : "s"}
            </label>
            <p className="field-hint">
              Matches use company, role/person, and date. Interviews also use
              stage. Existing application/contact/interview records are kept
              unchanged.
            </p>
            {preview.bundle.daily_targets && (
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={importTargets}
                  onChange={(event) => setImportTargets(event.target.checked)}
                  disabled={pending}
                />
                Use the daily targets from this workbook
              </label>
            )}
            {existingDates > 0 && (
              <div className="setup-note">
                {existingDates} daily log date{existingDates === 1 ? "" : "s"}{" "}
                already exist. Importing replaces their manual totals and notes
                with the previewed values.
              </div>
            )}
            {preview.errors.length > 0 && (
              <div className="error-box" role="alert">
                <strong>
                  Fix these {preview.errors.length} issue
                  {preview.errors.length === 1 ? "" : "s"} before importing
                </strong>
                <ul>
                  {preview.errors.slice(0, 15).map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
                {preview.errors.length > 15 && (
                  <p>…and {preview.errors.length - 15} more.</p>
                )}
                <p>Nothing has been saved.</p>
              </div>
            )}
            {total > 0 && (
              <>
                <div className="import-summary">
                  <Check size={18} />
                  <strong>{total} records in this import</strong>
                  <span>Previewing up to 5 per sheet</span>
                </div>
                <div className="import-sections">
                  {bundle.applications.length > 0 && (
                    <section>
                      <h3>Applications</h3>
                      <div className="table-scroll import-preview">
                        <table>
                          <thead>
                            <tr>
                              <th>Company / role</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Screening / interview / result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bundle.applications.slice(0, 5).map((row, i) => (
                              <tr key={i}>
                                <td>
                                  <strong>{row.company}</strong>
                                  <small>{row.role || "—"}</small>
                                </td>
                                <td>{prettyDate(row.applied_on)}</td>
                                <td>{row.status}</td>
                                <td>
                                  {row.screening || "—"} /{" "}
                                  {row.interview || "—"} / {row.result || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                  {bundle.contacts.length > 0 && (
                    <section>
                      <h3>Outreach contacts</h3>
                      <div className="table-scroll import-preview">
                        <table>
                          <thead>
                            <tr>
                              <th>Person</th>
                              <th>Company</th>
                              <th>Added</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bundle.contacts.slice(0, 5).map((row, i) => (
                              <tr key={i}>
                                <td>
                                  <strong>{row.person}</strong>
                                  <small>{row.role}</small>
                                </td>
                                <td>{row.company || "—"}</td>
                                <td>{prettyDate(row.added_on)}</td>
                                <td>{row.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                  {bundle.interviews.length > 0 && (
                    <section>
                      <h3>Interview journal</h3>
                      <div className="table-scroll import-preview">
                        <table>
                          <thead>
                            <tr>
                              <th>Company</th>
                              <th>Date</th>
                              <th>Stage</th>
                              <th>Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bundle.interviews.slice(0, 5).map((row, i) => (
                              <tr key={i}>
                                <td>
                                  <strong>{row.company}</strong>
                                  <small>{row.role}</small>
                                </td>
                                <td>{prettyDate(row.scheduled_on)}</td>
                                <td>{row.stage}</td>
                                <td>{row.result}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                  {bundle.daily_logs.length > 0 && (
                    <section>
                      <h3>Daily activity</h3>
                      <div className="table-scroll import-preview">
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Applications</th>
                              <th>Outreach</th>
                              <th>Follow-ups</th>
                              <th>Network</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bundle.daily_logs.slice(0, 5).map((row, i) => (
                              <tr key={i}>
                                <td>{prettyDate(row.activity_on)}</td>
                                <td>{row.applications ?? "Auto"}</td>
                                <td>{row.direct_outreach ?? "Auto"}</td>
                                <td>{row.followups ?? "Auto"}</td>
                                <td>{row.network_actions ?? 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </div>
              </>
            )}
          </>
        )}
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
      </div>
      <footer className="modal-footer">
        <button
          className="btn btn-secondary"
          disabled={pending || reading}
          onClick={close}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={
            pending ||
            reading ||
            needsMigration ||
            !total ||
            !!preview?.errors.length
          }
          onClick={() => void confirm()}
        >
          <Upload size={17} />
          {pending ? "Importing…" : `Import ${total || ""} records`}
        </button>
      </footer>
    </Modal>
  );
}
