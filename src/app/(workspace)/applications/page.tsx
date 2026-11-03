"use client";
import { useMemo, useState } from "react";
import {
  Plus,
  Upload,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useWorkspace, errorMessage } from "@/components/workspace-provider";
import { DataState, EmptyState, safeUrl, Modal } from "@/components/ui";
import { ApplicationForm } from "@/components/application-form";
import { ImportDialog } from "@/components/import-dialog";
import { STATUSES, type Application, type Status } from "@/lib/types";
import { prettyDate } from "@/lib/dates";
const PAGE_SIZE = 20;
export default function ApplicationsPage() {
  const { applications, saveApplication, deleteApplication, notify } =
    useWorkspace();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [workType, setWorkType] = useState("");
  const [source, setSource] = useState("");
  const [form, setForm] = useState<Application | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () =>
      applications.filter(
        (app) =>
          (!status || app.status === status) &&
          (!workType || app.work_type === workType) &&
          (!source || app.source === source) &&
          [
            app.company,
            app.role,
            app.contact_name,
            app.location,
            app.notes,
          ].some((v) => v?.toLowerCase().includes(search.toLowerCase())),
      ),
    [applications, status, workType, source, search],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const workTypes = [
    ...new Set(
      applications.map((a) => a.work_type).filter((v): v is string => !!v),
    ),
  ].sort();
  const sources = [
    ...new Set(
      applications.map((a) => a.source).filter((v): v is string => !!v),
    ),
  ].sort();
  async function updateStatus(app: Application, next: Status) {
    setPending(app.id);
    try {
      await saveApplication({ status: next }, app.id);
      notify("Status updated.");
    } catch (e) {
      notify(errorMessage(e));
    } finally {
      setPending(null);
    }
  }
  async function remove() {
    if (!deleting) return;
    setPending(deleting.id);
    setDeleteError("");
    try {
      await deleteApplication(deleting.id);
      setDeleting(null);
      notify("Application deleted.");
    } catch (e) {
      setDeleteError(errorMessage(e));
    } finally {
      setPending(null);
    }
  }
  const activeFilters = !!(search || status || workType || source);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR OPPORTUNITIES, ORGANIZED</span>
          <h1>
            Applications<span className="green-period">.</span>
          </h1>
          <p>Every opportunity has a story. Keep yours in one place.</p>
        </div>
        <div className="heading-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setImporting(true)}
          >
            <Upload size={17} /> Import CSV
          </button>
          <button className="btn btn-primary" onClick={() => setForm("new")}>
            <Plus size={18} /> Add application
          </button>
        </div>
      </div>
      <DataState>
        <section className="table-panel">
          <div className="table-toolbar">
            <div className="table-title">
              <h2>
                All applications{" "}
                <span className="neutral-badge">{applications.length}</span>
              </h2>
              <span className="muted">A clearer view of what’s next.</span>
            </div>
            <div className="filters">
              <label className="search-field">
                <Search size={17} />
                <input
                  aria-label="Search applications"
                  placeholder="Search company, role, contact…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                aria-label="Filter by work type"
                value={workType}
                onChange={(e) => {
                  setWorkType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All work types</option>
                {workTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <select
                aria-label="Filter by source"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All sources</option>
                {sources.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              {activeFilters && (
                <button
                  className="btn btn-quiet btn-small"
                  onClick={() => {
                    setSearch("");
                    setStatus("");
                    setWorkType("");
                    setSource("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
          {!visible.length ? (
            <EmptyState
              title={
                activeFilters
                  ? "No matches just yet"
                  : "Your next chapter starts here"
              }
              description={
                activeFilters
                  ? "Try another search or clear your filters."
                  : "Add your first application, or bring your existing tracker with a CSV import."
              }
            >
              {!activeFilters && (
                <button
                  className="btn btn-primary"
                  onClick={() => setForm("new")}
                >
                  <Plus size={17} /> Add your first application
                </button>
              )}
            </EmptyState>
          ) : (
            <>
              <div className="table-scroll">
                <table className="applications-table">
                  <thead>
                    <tr>
                      <th>Company / role</th>
                      <th>Applied on</th>
                      <th>Work type</th>
                      <th>Contact</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((app) => (
                      <tr
                        key={app.id}
                        className={`status-row-${app.status.toLowerCase()}`}
                      >
                        <td>
                          <button
                            className="company-cell"
                            onClick={() => setForm(app)}
                          >
                            <span className="company-avatar">
                              {app.company.slice(0, 1).toUpperCase()}
                            </span>
                            <span>
                              <strong>{app.company}</strong>
                              <small>{app.role || "Role not specified"}</small>
                            </span>
                          </button>
                        </td>
                        <td className="nowrap">
                          {prettyDate(app.applied_on)}
                          {!app.applied && (
                            <small className="muted">Not applied yet</small>
                          )}
                        </td>
                        <td>
                          <span className="table-work-type">
                            {app.work_type || "—"}
                          </span>
                          <small className="muted">{app.location}</small>
                        </td>
                        <td>
                          <strong className="contact-cell">
                            {app.contact_name || "—"}
                          </strong>
                          <small className="muted">
                            {app.contact_role ||
                              (app.contact_name
                                ? app.messaged
                                  ? "Messaged"
                                  : "Not messaged"
                                : "No contact yet")}
                          </small>
                        </td>
                        <td>{app.source || "—"}</td>
                        <td>
                          <select
                            className={`status-select status-${app.status.toLowerCase()}`}
                            aria-label={`Status for ${app.company}`}
                            value={app.status}
                            disabled={pending === app.id}
                            onChange={(e) =>
                              void updateStatus(app, e.target.value as Status)
                            }
                          >
                            {STATUSES.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="row-actions">
                            {safeUrl(app.job_url) && (
                              <a
                                className="icon-btn"
                                href={safeUrl(app.job_url)}
                                aria-label={`Open job at ${app.company}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink size={16} />
                              </a>
                            )}
                            <button
                              className="icon-btn"
                              onClick={() => setForm(app)}
                              aria-label={`Edit ${app.company}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="icon-btn delete-button"
                              onClick={() => {
                                setDeleting(app);
                                setDeleteError("");
                              }}
                              aria-label={`Delete ${app.company}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length} applications
                </span>
                <div className="pagination">
                  <button
                    className="icon-btn"
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <span>
                    {currentPage} / {pages}
                  </span>
                  <button
                    className="icon-btn"
                    disabled={currentPage === pages}
                    aria-label="Next page"
                    onClick={() => setPage(currentPage + 1)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </DataState>
      {form && (
        <ApplicationForm
          app={form === "new" ? undefined : form}
          close={() => setForm(null)}
        />
      )}
      {importing && <ImportDialog close={() => setImporting(false)} />}
      {deleting && (
        <Modal
          title="Delete this application?"
          close={() => setDeleting(null)}
          busy={!!pending}
        >
          <div className="form-content">
            <p>
              Delete your application for{" "}
              <strong>
                {deleting.role || "a role"} at {deleting.company}
              </strong>
              ? This also removes its conversation and follow-up history.
            </p>
            {deleteError && (
              <p className="error-box" role="alert">
                {deleteError}
              </p>
            )}
          </div>
          <footer className="modal-footer">
            <button
              className="btn btn-secondary"
              disabled={!!pending}
              onClick={() => setDeleting(null)}
            >
              Keep application
            </button>
            <button
              className="btn btn-danger"
              disabled={!!pending}
              onClick={() => void remove()}
            >
              {pending ? "Deleting…" : "Delete application"}
            </button>
          </footer>
        </Modal>
      )}
    </>
  );
}
