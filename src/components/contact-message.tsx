"use client";
import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Modal, safeUrl } from "./ui";
import { useWorkspace, errorMessage } from "./workspace-provider";
import { contactNextStep } from "@/lib/tracker";
import type { Contact } from "@/lib/types";
export function ContactMessage({
  contact,
  close,
}: {
  contact: Contact;
  close: () => void;
}) {
  const { today, saveContact, notify } = useWorkspace();
  const step = contactNextStep(contact, today);
  const name = contact.person.trim().split(/\s+/)[0];
  const initial =
    step?.kind === "followup1"
      ? `Hi ${name}, just following up on my earlier message. I’d love to explore how I could support ${contact.company || "your team"} with React, Next.js, and full-stack development. Is there a good time to connect? Thanks!`
      : step?.kind === "followup2"
        ? `Hi ${name}, one last friendly check-in. If ${contact.company || "your team"} could use support with React, Next.js, or web development, I’d be happy to share my work. Thanks for your time!`
        : contact.message_draft ||
          `Hi ${name}, I came across ${contact.company || "your work"} and wanted to connect. I’m a full-stack developer working with React and Next.js, and I’d love to explore any opportunities to support your team. Happy to share my portfolio. Thanks!`;
  const [text, setText] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify("Copied!");
    } catch {
      setError("Copy was unavailable. Select the text and copy it manually.");
    }
  }
  async function save(mark = false) {
    setPending(true);
    setError("");
    try {
      const update =
        mark && step
          ? step.kind === "first_message"
            ? {
                messaged: true,
                messaged_on: today,
                status:
                  contact.status === "Not Contacted"
                    ? ("Messaged" as const)
                    : contact.status,
              }
            : step.kind === "followup1"
              ? { followup1_on: today }
              : { followup2_on: today }
          : {};
      await saveContact(
        {
          ...(step?.kind === "first_message" || !step
            ? { message_draft: text }
            : {}),
          ...update,
        },
        contact.id,
      );
      notify(mark ? "Outreach step marked done." : "Draft saved.");
      if (mark) close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title={step?.label || "Outreach message"}
      close={close}
      drawer
      busy={pending}
    >
      <div className="drawer-content">
        <div className="drawer-person">
          <span className="avatar">{name.slice(0, 1)}</span>
          <div>
            <h3>{contact.person}</h3>
            <p>
              {contact.company || "Independent contact"} ·{" "}
              {contact.role || contact.company_type || "Contact"}
            </p>
          </div>
        </div>
        {safeUrl(contact.linkedin_url) && (
          <a
            className="text-link"
            href={safeUrl(contact.linkedin_url)}
            target="_blank"
            rel="noreferrer"
          >
            Open LinkedIn <ExternalLink size={14} />
          </a>
        )}
        {contact.why_targeted && (
          <p className="contact-context">{contact.why_targeted}</p>
        )}
        <label className="field">
          Your message
          <textarea
            rows={12}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setCopied(false);
            }}
          />
        </label>
        <button
          className="btn btn-primary copy-button"
          onClick={() => void copy()}
          disabled={!text.trim()}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? "Copied!" : "Copy message"}
        </button>
        <p className="drawer-note">
          Copying doesn’t send anything. Mark this step done after you send it
          yourself.
        </p>
        {(!step || step.kind === "first_message") && (
          <button
            className="btn btn-secondary full-width"
            disabled={pending}
            onClick={() => void save()}
          >
            Save draft
          </button>
        )}
        {step && (
          <button
            className="btn btn-secondary full-width"
            disabled={pending || !today}
            onClick={() => void save(true)}
          >
            <Check size={17} />
            {pending
              ? "Saving…"
              : step.kind === "first_message"
                ? "Mark message sent"
                : `Mark ${step.label.toLowerCase()} done`}
          </button>
        )}
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
