"use client";
import { useState } from "react";
import { Modal } from "./ui";
import { useWorkspace, errorMessage } from "./workspace-provider";
import { emptyContact, emptyInterview } from "@/lib/tracker";
import { localToday } from "@/lib/dates";
import {
  CONTACT_STATUSES,
  CONTACT_TYPES,
  INTERVIEW_STAGES,
  INTERVIEW_RESULTS,
  type Contact,
  type ContactInput,
  type Interview,
  type InterviewInput,
} from "@/lib/types";
type Values = Record<string, string | number | boolean | null>;
type Field = {
  key: string;
  label: string;
  type?: "text" | "date" | "url" | "textarea" | "checkbox" | "select";
  required?: boolean;
  options?: readonly (string | { value: string; label: string })[];
  wide?: boolean;
};
function RecordEditor<T extends object>({
  title,
  initial,
  fields,
  save,
  close,
  onFieldChange,
}: {
  title: string;
  initial: T;
  fields: Field[];
  save: (values: T) => Promise<void>;
  close: () => void;
  onFieldChange?: (
    key: string,
    value: string | boolean | null,
    current: Values,
  ) => Values;
}) {
  const [values, setValues] = useState<Values>(initial as Values);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  function change(key: string, value: string | boolean | null) {
    setValues((current) =>
      onFieldChange
        ? onFieldChange(key, value, current)
        : { ...current, [key]: value },
    );
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const clean = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() : value,
        ]),
      );
      const missing = fields.find(
        (field) => field.required && !clean[field.key],
      );
      if (missing) throw new Error(`${missing.label} is required.`);
      await save(clean as T);
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal title={title} close={close} wide busy={pending}>
      <form onSubmit={submit}>
        <fieldset className="form-fieldset" disabled={pending}>
          <div className="form-content">
            <div className="form-grid">
              {fields.map((field) => {
                const value = values[field.key];
                const type = field.type || "text";
                if (type === "checkbox")
                  return (
                    <label className="check-field" key={field.key}>
                      <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(event) =>
                          change(field.key, event.target.checked)
                        }
                      />
                      {field.label}
                    </label>
                  );
                return (
                  <label
                    key={field.key}
                    className={`field ${field.wide ? "span-two" : ""}`}
                  >
                    {field.label}
                    {type === "textarea" ? (
                      <textarea
                        rows={4}
                        value={String(value || "")}
                        onChange={(event) =>
                          change(field.key, event.target.value)
                        }
                        required={field.required}
                      />
                    ) : type === "select" ? (
                      <select
                        value={String(value || "")}
                        onChange={(event) =>
                          change(field.key, event.target.value || null)
                        }
                      >
                        {field.options?.map((option) => {
                          const item =
                            typeof option === "string"
                              ? { value: option, label: option || "Not set" }
                              : option;
                          return (
                            <option value={item.value} key={item.value}>
                              {item.label}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <input
                        type={type}
                        value={String(value || "")}
                        onChange={(event) =>
                          change(
                            field.key,
                            event.target.value || (type === "date" ? null : ""),
                          )
                        }
                        required={field.required}
                      />
                    )}
                  </label>
                );
              })}
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
            <button className="btn btn-primary">
              {pending ? "Saving…" : "Save changes"}
            </button>
          </footer>
        </fieldset>
      </form>
    </Modal>
  );
}
function editable<T extends object>(defaults: T, value?: object): T {
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [
      key,
      value && key in value ? value[key as keyof typeof value] : fallback,
    ]),
  ) as T;
}
export function ContactForm({
  contact,
  close,
}: {
  contact?: Contact;
  close: () => void;
}) {
  const { saveContact, notify } = useWorkspace();
  return (
    <RecordEditor<ContactInput>
      title={contact ? "Edit outreach contact" : "Add outreach contact"}
      initial={editable(emptyContact(), contact)}
      close={close}
      save={async (values) => {
        if (values.messaged && !values.messaged_on)
          throw new Error("Add the date you sent the message.");
        await saveContact(values, contact?.id);
        notify("Contact saved.");
      }}
      onFieldChange={(key, value, current) =>
        key === "messaged"
          ? {
              ...current,
              messaged: !!value,
              messaged_on: value ? current.messaged_on || localToday() : null,
              status:
                value && current.status === "Not Contacted"
                  ? "Messaged"
                  : !value && current.status === "Messaged"
                    ? "Not Contacted"
                    : current.status,
            }
          : { ...current, [key]: value }
      }
      fields={[
        { key: "person", label: "Person *", required: true },
        { key: "company", label: "Company" },
        { key: "role", label: "Role / title" },
        {
          key: "company_type",
          label: "Contact category",
          type: "select",
          options: ["", ...CONTACT_TYPES],
        },
        { key: "added_on", label: "Date added", type: "date" },
        { key: "linkedin_url", label: "LinkedIn URL", type: "url" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: CONTACT_STATUSES,
        },
        { key: "messaged", label: "I have sent a message", type: "checkbox" },
        { key: "messaged_on", label: "Message sent on", type: "date" },
        { key: "followup1_on", label: "Follow-up 1 done on", type: "date" },
        { key: "followup2_on", label: "Follow-up 2 done on", type: "date" },
        { key: "reply", label: "Reply" },
        {
          key: "why_targeted",
          label: "Why I’m reaching out",
          type: "textarea",
          wide: true,
        },
        {
          key: "message_draft",
          label: "Message draft",
          type: "textarea",
          wide: true,
        },
        { key: "notes", label: "Notes", type: "textarea", wide: true },
      ]}
    />
  );
}
export function InterviewForm({
  interview,
  close,
}: {
  interview?: Interview;
  close: () => void;
}) {
  const { applications, saveInterview, notify } = useWorkspace();
  return (
    <RecordEditor<InterviewInput>
      title={interview ? "Edit interview notes" : "Log an interview"}
      initial={editable(emptyInterview(), interview)}
      close={close}
      save={async (values) => {
        await saveInterview(values, interview?.id);
        notify("Interview saved.");
      }}
      onFieldChange={(key, value, current) => {
        const app =
          key === "application_id"
            ? applications.find((app) => app.id === value)
            : null;
        return {
          ...current,
          [key]: value,
          ...(app ? { company: app.company, role: app.role } : {}),
        };
      }}
      fields={[
        {
          key: "application_id",
          label: "Link an application (optional)",
          type: "select",
          wide: true,
          options: [
            { value: "", label: "No linked application" },
            ...applications.map((app) => ({
              value: app.id,
              label: `${app.company} · ${app.role || "Open role"}`,
            })),
          ],
        },
        { key: "company", label: "Company *", required: true },
        { key: "role", label: "Role" },
        {
          key: "scheduled_on",
          label: "Interview date *",
          type: "date",
          required: true,
        },
        {
          key: "stage",
          label: "Stage",
          type: "select",
          options: INTERVIEW_STAGES,
        },
        { key: "interviewer", label: "Interviewer" },
        {
          key: "result",
          label: "Result",
          type: "select",
          options: INTERVIEW_RESULTS,
        },
        {
          key: "questions",
          label: "Questions asked",
          type: "textarea",
          wide: true,
        },
        {
          key: "answer",
          label: "My answer / what happened",
          type: "textarea",
          wide: true,
        },
        { key: "mistake", label: "What I need to improve", type: "textarea" },
        {
          key: "correct_answer",
          label: "Correct answer / reference",
          type: "textarea",
        },
        {
          key: "next_action",
          label: "Action before my next interview",
          type: "textarea",
          wide: true,
        },
      ]}
    />
  );
}
export function DeleteRecordDialog({
  title,
  description,
  remove,
  close,
}: {
  title: string;
  description: string;
  remove: () => Promise<void>;
  close: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { notify } = useWorkspace();
  async function confirm() {
    setPending(true);
    try {
      await remove();
      notify("Record deleted.");
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal title={title} close={close} busy={pending}>
      <div className="form-content">
        <p>{description}</p>
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
      </div>
      <footer className="modal-footer">
        <button
          className="btn btn-secondary"
          disabled={pending}
          onClick={close}
        >
          Keep record
        </button>
        <button
          className="btn btn-danger"
          disabled={pending}
          onClick={() => void confirm()}
        >
          {pending ? "Deleting…" : "Delete record"}
        </button>
      </footer>
    </Modal>
  );
}
