"use client";
import { useEffect, useRef } from "react";
import { X, LoaderCircle, Inbox } from "lucide-react";
import { useWorkspace } from "./workspace-provider";
export function Modal({
  title,
  children,
  close,
  wide = false,
  drawer = false,
  busy = false,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
  wide?: boolean;
  drawer?: boolean;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""} ${drawer ? "drawer" : ""}`}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) close();
      }}
    >
      <div className="modal-inner">
        <header className="modal-header">
          <h2 id="dialog-title">{title}</h2>
          <button
            className="icon-btn"
            onClick={close}
            disabled={busy}
            aria-label="Close dialog"
          >
            <X size={21} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export function MigrationNotice() {
  return (
    <div className="setup-note migration-note">
      <strong>Your workspace has a new version</strong>
      <p>
        Run <code>supabase/migrations/20261104_workbook_workspace.sql</code> in
        your Supabase SQL Editor, then refresh. This adds contacts, interviews,
        daily activity, and the extra application fields while preserving your
        saved records.
      </p>
    </div>
  );
}
export function DataState({
  children,
  extended = false,
}: {
  children: React.ReactNode;
  extended?: boolean;
}) {
  const { loading, error, reload, needsMigration } = useWorkspace();
  if (loading)
    return (
      <div className="loading-state" role="status">
        <LoaderCircle size={25} className="spin" />
        <p>Loading your workspace…</p>
      </div>
    );
  if (error)
    return (
      <div className="error-box" role="alert">
        <strong>Couldn’t load your workspace</strong>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => void reload()}>
          Try again
        </button>
      </div>
    );
  if (extended && needsMigration) return <MigrationNotice />;
  return children;
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Inbox size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function safeUrl(value: string | null): string | undefined {
  if (!value) return;
  try {
    const url = new URL(value);
    if (["https:", "http:"].includes(url.protocol)) return url.href;
  } catch {
    /* Invalid imported link stays plain text. */
  }
}
