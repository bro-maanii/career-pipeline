"use client";
import { useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MessageSquare,
  Upload,
  ExternalLink,
} from "lucide-react";
import { useWorkspace, errorMessage } from "@/components/workspace-provider";
import { DataState, EmptyState, safeUrl } from "@/components/ui";
import { ContactForm, DeleteRecordDialog } from "@/components/tracker-forms";
import { ContactMessage } from "@/components/contact-message";
import { ImportDialog } from "@/components/import-dialog";
import { CONTACT_STATUSES, type Contact } from "@/lib/types";
import { contactNextStep } from "@/lib/tracker";
import { prettyDate } from "@/lib/dates";
export default function ContactsPage() {
  const { contacts, today, saveContact, deleteContact, notify } =
    useWorkspace();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState("all");
  const [limit, setLimit] = useState(20);
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [message, setMessage] = useState<Contact | null>(null);
  const [importing, setImporting] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const unmessaged = contacts.filter(
    (c) => contactNextStep(c, today)?.kind === "first_message",
  ).length;
  const due = contacts.filter((c) => {
    const step = contactNextStep(c, today);
    return step && step.kind !== "first_message";
  }).length;
  const matches = contacts.filter(
    (c) =>
      (!filter || c.status === filter) &&
      [c.person, c.company, c.role, c.why_targeted].some((v) =>
        v?.toLowerCase().includes(search.toLowerCase()),
      ) &&
      (tab === "all" ||
        (tab === "new"
          ? contactNextStep(c, today)?.kind === "first_message"
          : !!contactNextStep(c, today) &&
            contactNextStep(c, today)?.kind !== "first_message")),
  );
  async function updateStatus(c: Contact, status: Contact["status"]) {
    setPending(c.id);
    try {
      await saveContact({ status }, c.id);
      notify("Contact status updated.");
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
          <span className="eyebrow">BUILD RELATIONSHIPS BEYOND JOB POSTS</span>
          <h1>
            Outreach contacts<span className="green-period">.</span>
          </h1>
          <p>Founders, recruiters, and people you want to work with.</p>
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
            Add contact
          </button>
        </div>
      </div>
      <DataState extended>
        <div className="view-tabs" aria-label="Contact views">
          {[
            ["all", "All contacts", contacts.length],
            ["new", "Not messaged", unmessaged],
            ["due", "Follow-ups due", due],
          ].map(([key, label, count]) => (
            <button
              className={tab === key ? "selected" : ""}
              key={key}
              onClick={() => {
                setTab(String(key));
                setLimit(20);
              }}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <section className="table-panel">
          <div className="table-toolbar">
            <div className="filters">
              <label className="search-field">
                <Search size={17} />
                <input
                  aria-label="Search contacts"
                  placeholder="Search person, company, or reason…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setLimit(20);
                  }}
                />
              </label>
              <select
                aria-label="Filter contacts by status"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setLimit(20);
                }}
              >
                <option value="">All statuses</option>
                {CONTACT_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          {!matches.length ? (
            <EmptyState
              title={
                contacts.length
                  ? "No contacts in this view"
                  : "Start with one good conversation"
              }
              description="Add people you want to reach out to, even when there’s no job posted."
            />
          ) : (
            <div className="table-scroll">
              <table className="contacts-table">
                <thead>
                  <tr>
                    <th>Person / company</th>
                    <th>Why targeted</th>
                    <th>Next action</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.slice(0, limit).map((c) => {
                    const next = today ? contactNextStep(c, today) : null;
                    return (
                      <tr key={c.id}>
                        <td>
                          <button
                            className="company-cell"
                            onClick={() => setEditing(c)}
                          >
                            <span className="avatar">
                              {c.person.slice(0, 1)}
                            </span>
                            <span>
                              <strong>{c.person}</strong>
                              <small>
                                {c.company ||
                                  c.company_type ||
                                  "Independent contact"}
                              </small>
                              <small>{c.role}</small>
                            </span>
                          </button>
                        </td>
                        <td>
                          <p className="table-clamp">{c.why_targeted || "—"}</p>
                        </td>
                        <td>
                          {next ? (
                            <span
                              className={`action-pill ${next.kind !== "first_message" ? "action-due" : ""}`}
                            >
                              {next.label}
                              {next.overdue > 0
                                ? ` · ${next.overdue}d overdue`
                                : ""}
                            </span>
                          ) : (
                            <span className="muted">
                              {c.followup2_on
                                ? "Follow-ups complete"
                                : c.messaged_on
                                  ? `Messaged ${prettyDate(c.messaged_on)}`
                                  : "No action due"}
                            </span>
                          )}
                        </td>
                        <td>
                          <select
                            className="status-select"
                            aria-label={`Status for ${c.person}`}
                            disabled={pending === c.id}
                            value={c.status}
                            onChange={(e) =>
                              void updateStatus(
                                c,
                                e.target.value as Contact["status"],
                              )
                            }
                          >
                            {CONTACT_STATUSES.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-btn"
                              aria-label={`Message ${c.person}`}
                              onClick={() => setMessage(c)}
                            >
                              <MessageSquare size={17} />
                            </button>
                            {safeUrl(c.linkedin_url) && (
                              <a
                                className="icon-btn"
                                href={safeUrl(c.linkedin_url)}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`LinkedIn for ${c.person}`}
                              >
                                <ExternalLink size={16} />
                              </a>
                            )}
                            <button
                              className="icon-btn"
                              onClick={() => setEditing(c)}
                              aria-label={`Edit ${c.person}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="icon-btn delete-button"
                              onClick={() => setDeleting(c)}
                              aria-label={`Delete ${c.person}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="table-footer">
            <span>
              {Math.min(limit, matches.length)} of {matches.length} contacts
            </span>
            {matches.length > limit && (
              <button
                className="btn btn-small btn-secondary"
                onClick={() => setLimit(limit + 20)}
              >
                Show more
              </button>
            )}
          </div>
        </section>
      </DataState>
      {editing && (
        <ContactForm
          contact={editing === "new" ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteRecordDialog
          title="Delete this contact?"
          description={`Remove ${deleting.person} and their outreach history?`}
          close={() => setDeleting(null)}
          remove={() => deleteContact(deleting.id)}
        />
      )}
      {message && (
        <ContactMessage contact={message} close={() => setMessage(null)} />
      )}
      {importing && <ImportDialog close={() => setImporting(false)} />}
    </>
  );
}
