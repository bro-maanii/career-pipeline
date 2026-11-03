"use client";
import Link from "next/link";
import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Modal, safeUrl } from "./ui";
import { useWorkspace, errorMessage } from "./workspace-provider";
import { fillTemplate } from "@/lib/followups";
import { KIND_LABELS, type Application, type TemplateKind } from "@/lib/types";
export function MessageDrawer({
  app,
  kind,
  close,
}: {
  app: Application;
  kind: TemplateKind;
  close: () => void;
}) {
  const { templates, notify } = useWorkspace();
  const available = templates.filter((t) => t.kind === kind);
  const [selected, setSelected] = useState(available[0]?.id || "");
  const [text, setText] = useState(
    available[0] ? fillTemplate(available[0].body, app) : "",
  );
  const [copied, setCopied] = useState(false);
  const contactUrl = safeUrl(app.contact_linkedin);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify("Copied!");
    } catch (e) {
      notify(
        `Copy failed. Select the message and copy it manually. ${errorMessage(e)}`,
      );
    }
  }
  return (
    <Modal title="A conversation starts here" close={close} drawer>
      <div className="drawer-content">
        <span className="eyebrow">{KIND_LABELS[kind]}</span>
        <div className="drawer-person">
          <span className="avatar">
            {(app.contact_name || app.company).slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h3>{app.contact_name || "Your contact"}</h3>
            <p>
              {app.company} · {app.role || "Open position"}
            </p>
          </div>
        </div>
        {contactUrl && (
          <a
            className="text-link"
            href={contactUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open LinkedIn profile <ExternalLink size={14} />
          </a>
        )}
        {available.length ? (
          <label className="field">
            Choose a template
            <select
              value={selected}
              onChange={(e) => {
                const template = available.find((t) => t.id === e.target.value);
                setSelected(e.target.value);
                setText(template ? fillTemplate(template.body, app) : "");
                setCopied(false);
              }}
            >
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="setup-note">
            No templates for this step yet.{" "}
            <Link className="text-link" href="/templates">
              Add a template
            </Link>
            , or write a message below.
          </div>
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
            placeholder="Write a short, friendly message…"
          />
        </label>
        <p className="field-hint">
          Personalized for{" "}
          {app.contact_name?.trim().split(/\s+/)[0] || "your contact"}. Make it
          sound like you.
        </p>
        <button
          className="btn btn-primary copy-button"
          onClick={() => void copy()}
          disabled={!text.trim()}
        >
          {copied ? <Check size={19} /> : <Copy size={19} />}
          {copied ? "Copied!" : "Copy message"}
        </button>
        <p className="drawer-note">
          Send it when you’re ready, then mark it done on Today.
        </p>
      </div>
    </Modal>
  );
}
