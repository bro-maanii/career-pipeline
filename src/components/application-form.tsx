"use client";
import { useState } from "react";
import { Modal } from "./ui";
import { useWorkspace, errorMessage } from "./workspace-provider";
import { emptyApplication } from "@/lib/csv";
import {
  STATUSES,
  WORK_TYPES,
  SOURCES,
  MILESTONES,
  type Application,
  type ApplicationInput,
} from "@/lib/types";
export function ApplicationForm({
  app,
  close,
}: {
  app?: Application;
  close: () => void;
}) {
  const { saveApplication, notify } = useWorkspace();
  const [values, setValues] = useState<ApplicationInput>(() =>
    app ? { ...app } : emptyApplication(),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  function set<K extends keyof ApplicationInput>(
    key: K,
    value: ApplicationInput[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }
  function field(
    key: keyof ApplicationInput,
    label: string,
    type = "text",
    required = false,
  ) {
    return (
      <label className="field" key={key}>
        {label}
        <input
          type={type}
          value={String(values[key] ?? "")}
          onChange={(e) =>
            set(key, e.target.value || (type === "date" ? null : ""))
          }
          required={required}
          maxLength={type === "date" ? undefined : 2000}
        />
      </label>
    );
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      if (!values.company.trim()) throw new Error("Company is required.");
      if (values.messaged && !values.messaged_on)
        throw new Error("Set a message date so follow-ups can be scheduled.");
      const { company, ...rest } = values;
      // Pick only editable columns; IDs and owner fields never enter an update.
      const clean = Object.fromEntries(
        Object.keys(emptyApplication()).map((k) => [
          k,
          k === "company" ? company.trim() : rest[k as keyof typeof rest],
        ]),
      ) as ApplicationInput;
      await saveApplication(clean, app?.id);
      notify(
        app ? "Application updated." : "Application added. One step forward.",
      );
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title={app ? "Edit application" : "Add an application"}
      close={close}
      wide
      busy={pending}
    >
      <form onSubmit={submit}>
        <fieldset disabled={pending} className="form-fieldset">
          <div className="form-content">
            <p className="muted">
              The essentials first. Add the details as your conversation grows.
            </p>
            <h3 className="form-section-title">The opportunity</h3>
            <div className="form-grid">
              {field("company", "Company *", "text", true)}
              {field("role", "Role")}
              {field("applied_on", "Applied on", "date")}
              {field("location", "Location")}
              <label className="field">
                Work type
                <input
                  list="work-types"
                  value={values.work_type || ""}
                  onChange={(e) => set("work_type", e.target.value)}
                />
                <datalist id="work-types">
                  {WORK_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </label>
              <label className="field">
                Source
                <input
                  list="sources"
                  value={values.source || ""}
                  onChange={(e) => set("source", e.target.value)}
                />
                <datalist id="sources">
                  {SOURCES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>
              {field("job_url", "Job URL", "url")}
              {field("salary", "Salary")}
              <label className="field">
                Status
                <select
                  value={values.status}
                  onChange={(e) =>
                    set("status", e.target.value as ApplicationInput["status"])
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={values.applied}
                  onChange={(e) => set("applied", e.target.checked)}
                />{" "}
                I have applied
              </label>
            </div>
            <h3 className="form-section-title">The conversation</h3>
            <div className="form-grid">
              {field("contact_name", "Contact name")}
              {field("contact_role", "Contact role")}
              {field("contact_linkedin", "Contact LinkedIn", "url")}
              {field("connection_sent_on", "Connection sent on", "date")}
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={values.messaged}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      messaged: e.target.checked,
                      messaged_on: e.target.checked
                        ? prev.messaged_on || prev.applied_on || null
                        : null,
                    }))
                  }
                />{" "}
                I have sent a message
              </label>
              {field("messaged_on", "Messaged on", "date")}
              {field("followup1_on", "Follow-up 1 completed on", "date")}
              {field("followup2_on", "Follow-up 2 completed on", "date")}
            </div>
            <h3 className="form-section-title">A little context</h3>
            <div className="form-grid milestone-form">
              {(["screening", "interview", "result"] as const).map((key) => (
                <label className="field" key={key}>
                  {key === "screening"
                    ? "Screening progress"
                    : key === "interview"
                      ? "Interview progress"
                      : "Final result"}
                  <select
                    value={values[key] || ""}
                    onChange={(event) => set(key, event.target.value)}
                  >
                    {[
                      ...MILESTONES,
                      ...(key === "result" ? ["Offer", "Rejected"] : []),
                      ...(values[key] &&
                      ![...MILESTONES, "Offer", "Rejected"].includes(
                        values[key]!,
                      )
                        ? [values[key]!]
                        : []),
                    ].map((value) => (
                      <option key={value} value={value}>
                        {value || "Not recorded"}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <p className="field-hint">
              These fields preserve the stages you reached, even when the
              current status changes later.
            </p>
            <div className="form-grid">
              {(
                [
                  ["response", "Response"],
                  ["why_applied", "Why I applied"],
                  ["notes", "Notes"],
                ] as const
              ).map(([key, label]) => (
                <label
                  className={`field ${key === "notes" ? "span-two" : ""}`}
                  key={key}
                >
                  {label}
                  <textarea
                    rows={3}
                    value={values[key] || ""}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
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
            <button className="btn btn-primary" type="submit">
              {pending ? "Saving…" : app ? "Save changes" : "Add application"}
            </button>
          </footer>
        </fieldset>
      </form>
    </Modal>
  );
}
