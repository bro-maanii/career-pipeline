"use client";
import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import { DataState, EmptyState, Modal } from "@/components/ui";
import { useWorkspace, errorMessage } from "@/components/workspace-provider";
import {
  TEMPLATE_KINDS,
  KIND_LABELS,
  type Template,
  type TemplateInput,
  type TemplateKind,
} from "@/lib/types";
export default function TemplatesPage() {
  const { templates, saveTemplate, deleteTemplate, notify } = useWorkspace();
  const [editing, setEditing] = useState<Template | "new" | null>(null);
  const [values, setValues] = useState<TemplateInput>({
    kind: "first_message",
    title: "",
    body: "",
  });
  const [deleting, setDeleting] = useState<Template | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  function edit(template?: Template) {
    setEditing(template || "new");
    setValues(
      template
        ? { kind: template.kind, title: template.title, body: template.body }
        : { kind: "first_message", title: "", body: "" },
    );
    setError("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      if (!values.title.trim() || !values.body.trim())
        throw new Error("A title and message are required.");
      await saveTemplate(
        { ...values, title: values.title.trim(), body: values.body.trim() },
        editing && editing !== "new" ? editing.id : undefined,
      );
      notify("Template saved.");
      setEditing(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setPending(true);
    setError("");
    try {
      await deleteTemplate(deleting.id);
      notify("Template deleted.");
      setDeleting(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE RIGHT WORDS, READY WHEN YOU ARE</span>
          <h1>
            Message templates<span className="green-period">.</span>
          </h1>
          <p>A thoughtful starting point. Add your own voice.</p>
        </div>
        <button
          className="btn btn-primary"
          data-tour="templates-create"
          onClick={() => edit()}
        >
          <Plus size={18} /> New template
        </button>
      </div>
      <div className="template-tip" data-tour="templates-library">
        <MessageSquare size={20} />
        <p>
          Keep it personal. <code>{"{name}"}</code> uses your contact’s first
          name. <code>{"{company}"}</code> and <code>{"{role}"}</code> fill in
          the rest.
        </p>
        <ArrowUpRight size={19} />
      </div>
      <DataState>
        {templates.length ? (
          <div className="template-groups">
            {TEMPLATE_KINDS.map((kind, index) => (
              <section key={kind}>
                <div className="template-group-heading">
                  <span className="step-label">0{index + 1}</span>
                  <h2>{KIND_LABELS[kind]}</h2>
                  <span className="neutral-badge">
                    {templates.filter((t) => t.kind === kind).length}
                  </span>
                </div>
                <div className="template-grid">
                  {templates
                    .filter((t) => t.kind === kind)
                    .map((template) => (
                      <article className="template-card" key={template.id}>
                        <div className="template-card-top">
                          <h3>{template.title}</h3>
                          <div className="row-actions">
                            <button
                              className="icon-btn"
                              onClick={() => edit(template)}
                              aria-label={`Edit ${template.title}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="icon-btn delete-button"
                              onClick={() => {
                                setDeleting(template);
                                setError("");
                              }}
                              aria-label={`Delete ${template.title}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p>{template.body}</p>
                        <footer>
                          <span className="workspace-dot" /> Ready to
                          personalize
                        </footer>
                      </article>
                    ))}
                  {!templates.some((t) => t.kind === kind) && (
                    <button
                      className="add-template-card"
                      onClick={() => {
                        edit();
                        setValues((prev) => ({ ...prev, kind }));
                      }}
                    >
                      <Plus size={19} /> Add a {KIND_LABELS[kind].toLowerCase()}{" "}
                      template
                    </button>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Find your words"
            description="Create a short, friendly message you can reuse for every opportunity."
          >
            <button className="btn btn-primary" onClick={() => edit()}>
              <Plus size={17} /> Create your first template
            </button>
          </EmptyState>
        )}
      </DataState>
      {editing && (
        <Modal
          title={
            editing === "new"
              ? "Create a message template"
              : "Edit message template"
          }
          close={() => setEditing(null)}
          busy={pending}
        >
          <form onSubmit={save}>
            <fieldset className="form-fieldset" disabled={pending}>
              <div className="form-content form-stack">
                <label className="field">
                  Message type
                  <select
                    value={values.kind}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        kind: e.target.value as TemplateKind,
                      }))
                    }
                  >
                    {TEMPLATE_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {KIND_LABELS[kind]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Title
                  <input
                    required
                    maxLength={200}
                    placeholder="e.g. A friendly introduction"
                    value={values.title}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  Message
                  <textarea
                    rows={9}
                    required
                    placeholder="Hi {name}, …"
                    value={values.body}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, body: e.target.value }))
                    }
                  />
                </label>
                <p className="field-hint">
                  Available placeholders: {"{name}"}, {"{company}"}, {"{role}"}
                </p>
                {error && (
                  <p className="error-box" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <footer className="modal-footer">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary">
                  {pending ? "Saving…" : "Save template"}
                </button>
              </footer>
            </fieldset>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Delete this template?"
          close={() => setDeleting(null)}
          busy={pending}
        >
          <div className="form-content">
            <p>
              Remove <strong>{deleting.title}</strong> from your message
              templates?
            </p>
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
              onClick={() => setDeleting(null)}
            >
              Keep template
            </button>
            <button
              className="btn btn-danger"
              disabled={pending}
              onClick={() => void remove()}
            >
              {pending ? "Deleting…" : "Delete template"}
            </button>
          </footer>
        </Modal>
      )}
    </>
  );
}
