"use client";
import { useState } from "react";
import { Upload, FileSpreadsheet, Check } from "lucide-react";
import { Modal } from "./ui";
import { useWorkspace, errorMessage } from "./workspace-provider";
import { parseImport } from "@/lib/csv";
import { prettyDate, localToday } from "@/lib/dates";
import type { ApplicationInput } from "@/lib/types";
export function ImportDialog({ close }: { close: () => void }) {
  const { importApplications, notify } = useWorkspace();
  const [rows, setRows] = useState<ApplicationInput[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [pending, setPending] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  async function read(file?: File) {
    if (!file) return;
    setReading(true);
    setError("");
    setRows([]);
    setErrors([]);
    setFileName(file.name);
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Please choose a CSV smaller than 5 MB.");
      const result = parseImport(await file.text(), localToday());
      setRows(result.rows);
      setErrors(result.errors);
      if (!result.rows.length && !result.errors.length)
        setError("This file has no application rows.");
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
      await importApplications(rows);
      notify(`${rows.length} applications imported.`);
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title="Bring your tracker along"
      close={close}
      wide
      busy={pending || reading}
    >
      <div className="form-content">
        <p className="muted">
          Export the “Job Tracker” sheet from Excel as CSV, then review it here
          before importing.
        </p>
        <label className="upload-area">
          <FileSpreadsheet size={30} />
          <strong>
            {reading
              ? "Reading your file…"
              : fileName || "Choose your CSV file"}
          </strong>
          <span>CSV files up to 5 MB · No data is saved until you confirm</span>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={pending || reading}
            onChange={(e) => void read(e.target.files?.[0])}
          />
        </label>
        <p className="field-hint">
          Dates: dd/mm/yy, dd/mm/yyyy, ISO, or Excel serial. “Yes” follow-ups
          use today’s date. Importing the same file again creates new rows.
        </p>
        {!!errors.length && (
          <div className="error-box" role="alert">
            <strong>
              Please fix these {errors.length} issue
              {errors.length === 1 ? "" : "s"} in the CSV
            </strong>
            <ul>
              {errors.slice(0, 15).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
            {errors.length > 15 && <p>…and {errors.length - 15} more.</p>}
            <p>Nothing will be imported until all issues are fixed.</p>
          </div>
        )}
        {!!rows.length && (
          <>
            <div className="import-summary">
              <Check size={18} />
              <strong>
                {rows.length} application{rows.length === 1 ? "" : "s"} ready to
                review
              </strong>
              <span>Previewing the first {Math.min(rows.length, 10)}</span>
            </div>
            <div className="table-scroll import-preview">
              <table>
                <thead>
                  <tr>
                    <th>Company / role</th>
                    <th>Applied on</th>
                    <th>Contact / messaged</th>
                    <th>Follow-ups</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{row.company}</strong>
                        <small>{row.role || "—"}</small>
                      </td>
                      <td>{prettyDate(row.applied_on)}</td>
                      <td>
                        {row.contact_name || "—"}
                        <small>
                          {row.messaged
                            ? `Yes · ${prettyDate(row.messaged_on)}`
                            : "Not messaged"}
                        </small>
                      </td>
                      <td>
                        <small>1: {prettyDate(row.followup1_on)}</small>
                        <small>2: {prettyDate(row.followup2_on)}</small>
                      </td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          disabled={pending || reading || !rows.length || !!errors.length}
          onClick={() => void confirm()}
        >
          <Upload size={17} />
          {pending ? "Importing…" : `Import ${rows.length || ""} applications`}
        </button>
      </footer>
    </Modal>
  );
}
