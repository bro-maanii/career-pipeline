"use client";
import { useState } from "react";
import { Modal } from "./ui";
import { useWorkspace, errorMessage } from "./workspace-provider";
import {
  REPLY_OUTCOMES,
  applicationReplyUpdate,
  contactReplyUpdate,
  redirectedContact,
  type ReplyOutcome,
} from "@/lib/replies";
import type { Application, Contact, TemplateKind } from "@/lib/types";

export type ReplyTarget =
  | { type: "application"; app: Application; kind: TemplateKind }
  | { type: "contact"; contact: Contact; kind: TemplateKind };

const DONE_MESSAGE: Record<ReplyOutcome, string> = {
  progress: "Status is now Replied. Follow-ups stopped.",
  referred: "Reply saved. The follow-up clock restarted from today.",
  redirect:
    "New contact added to Today. Follow-ups for the first person stopped.",
  declined: "Marked as declined. No more reminders.",
};

export function ReplyDialog({
  target,
  close,
}: {
  target: ReplyTarget;
  close: () => void;
}) {
  const { today, saveApplication, saveContact, notify } = useWorkspace();
  const [outcome, setOutcome] = useState<ReplyOutcome>("progress");
  const [text, setText] = useState("");
  const [next, setNext] = useState({ person: "", role: "", linkedin_url: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const name =
    target.type === "application"
      ? target.app.contact_name || "Your contact"
      : target.contact.person;
  const company =
    target.type === "application"
      ? target.app.company
      : target.contact.company || "";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!today) return;
    if (outcome === "redirect" && !next.person.trim()) {
      setError("Naye bande ka naam likhein.");
      return;
    }
    setPending(true);
    setError("");
    try {
      if (outcome === "redirect")
        await saveContact(
          redirectedContact(
            next,
            {
              name,
              company,
              // A contact's own role is their job title, not the position you want.
              role: target.type === "application" ? target.app.role : null,
              text,
            },
            today,
          ),
        );
      if (target.type === "application")
        await saveApplication(
          applicationReplyUpdate(target.app, target.kind, outcome, text, today),
          target.app.id,
        );
      else
        await saveContact(
          contactReplyUpdate(target.contact, target.kind, outcome, text, today),
          target.contact.id,
        );
      notify(DONE_MESSAGE[outcome]);
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title="Reply aaya" close={close} busy={pending}>
      <form onSubmit={submit}>
        <fieldset className="form-fieldset" disabled={pending}>
          <div className="form-content form-stack">
            <p className="muted">
              {name}
              {company ? ` · ${company}` : ""} ne kya kaha?
            </p>
            <div className="reply-options" role="radiogroup">
              {REPLY_OUTCOMES.map((option) => (
                <label
                  key={option.value}
                  className={`reply-option ${outcome === option.value ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="reply-outcome"
                    value={option.value}
                    checked={outcome === option.value}
                    onChange={() => setOutcome(option.value)}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </span>
                </label>
              ))}
            </div>
            {outcome === "redirect" && (
              <div className="form-grid">
                <label className="field">
                  Naye bande ka naam *
                  <input
                    value={next.person}
                    onChange={(e) =>
                      setNext({ ...next, person: e.target.value })
                    }
                    required
                  />
                </label>
                <label className="field">
                  Role (jaise HR, Recruiter)
                  <input
                    value={next.role}
                    onChange={(e) => setNext({ ...next, role: e.target.value })}
                  />
                </label>
                <label className="field span-two">
                  LinkedIn link
                  <input
                    type="url"
                    value={next.linkedin_url}
                    onChange={(e) =>
                      setNext({ ...next, linkedin_url: e.target.value })
                    }
                  />
                </label>
              </div>
            )}
            <label className="field">
              Unka reply (optional)
              <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Jaise: Main ne aap ko HR team ko refer kar diya hai"
              />
            </label>
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
          </div>
          <footer className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {pending ? "Saving…" : "Save"}
            </button>
          </footer>
        </fieldset>
      </form>
    </Modal>
  );
}
