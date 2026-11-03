"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import type {
  Application,
  ApplicationInput,
  Template,
  TemplateInput,
} from "@/lib/types";
import { localToday } from "@/lib/dates";
type Workspace = {
  applications: Application[];
  templates: Template[];
  loading: boolean;
  error: string;
  today: string;
  reload: () => Promise<void>;
  notify: (message: string) => void;
  saveApplication: (
    input: ApplicationInput | Partial<ApplicationInput>,
    id?: string,
  ) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  importApplications: (rows: ApplicationInput[]) => Promise<void>;
  saveTemplate: (input: TemplateInput, id?: string) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
};
const Context = createContext<Workspace | null>(null);
export function WorkspaceProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [today, setToday] = useState("");
  const notify = useCallback((message: string) => setToast(message), []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const refresh = () => setToday(localToday());
    refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const load = useCallback(
    () =>
      Promise.resolve()
        .then(async () => {
          const supabase = createClient();
          const readAll = async (table: "applications" | "templates") => {
            const rows: unknown[] = [];
            for (let from = 0; ; from += 1000) {
              const { data, error } = await supabase
                .from(table)
                .select("*")
                .eq("user_id", userId)
                .order(table === "applications" ? "created_at" : "title", {
                  ascending: table !== "applications",
                })
                .order("id")
                .range(from, from + 999);
              if (error) throw error;
              rows.push(...data);
              if (data.length < 1000) return rows;
            }
          };
          const [apps, temps] = await Promise.all([
            readAll("applications"),
            readAll("templates"),
          ]);
          return {
            apps: apps as Application[],
            templates: temps as Template[],
          };
        })
        .then((data) => {
          setError("");
          setApplications(data.apps);
          setTemplates(data.templates);
        })
        .catch((e) => setError(errorMessage(e)))
        .finally(() => setLoading(false)),
    [userId],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    await load();
  }, [load]);
  async function saveApplication(
    input: ApplicationInput | Partial<ApplicationInput>,
    id?: string,
  ) {
    const db = createClient();
    const result = id
      ? await db
          .from("applications")
          .update(input)
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single()
      : await db
          .from("applications")
          .insert({ ...input, user_id: userId })
          .select()
          .single();
    if (result.error) throw result.error;
    const app = result.data as Application;
    setApplications((prev) =>
      id ? prev.map((a) => (a.id === id ? app : a)) : [app, ...prev],
    );
  }
  async function deleteApplication(id: string) {
    const { error, data } = await createClient()
      .from("applications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .single();
    if (error || !data)
      throw error || new Error("Application could not be deleted.");
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }
  async function importApplications(rows: ApplicationInput[]) {
    // One insert is atomic: a bad row cannot leave a partially imported CSV.
    const { error } = await createClient()
      .from("applications")
      .insert(rows.map((row) => ({ ...row, user_id: userId })));
    if (error) throw error;
    await reload();
  }
  async function saveTemplate(input: TemplateInput, id?: string) {
    const db = createClient();
    const result = id
      ? await db
          .from("templates")
          .update(input)
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single()
      : await db
          .from("templates")
          .insert({ ...input, user_id: userId })
          .select()
          .single();
    if (result.error) throw result.error;
    const template = result.data as Template;
    setTemplates((prev) =>
      id ? prev.map((t) => (t.id === id ? template : t)) : [...prev, template],
    );
  }
  async function deleteTemplate(id: string) {
    const { error, data } = await createClient()
      .from("templates")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .single();
    if (error || !data)
      throw error || new Error("Template could not be deleted.");
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }
  return (
    <Context.Provider
      value={{
        applications,
        templates,
        loading,
        error,
        today,
        reload,
        notify,
        saveApplication,
        deleteApplication,
        importApplications,
        saveTemplate,
        deleteTemplate,
      }}
    >
      {children}
      {toast &&
        createPortal(
          <div className="toast" role="status">
            {toast}
          </div>,
          document.querySelector("dialog[open] .modal-inner") || document.body,
        )}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("Workspace provider missing.");
  return context;
}
export function errorMessage(e: unknown): string {
  return e && typeof e === "object" && "message" in e
    ? String(e.message)
    : "Something went wrong. Please try again.";
}
