"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import type {
  Application,
  ApplicationInput,
  Template,
  TemplateInput,
  Contact,
  ContactInput,
  Interview,
  InterviewInput,
  DailyLog,
  DailyLogInput,
  DailyTargets,
  TrackerBundle,
} from "@/lib/types";
import { localToday } from "@/lib/dates";
import { DEFAULT_TARGETS } from "@/lib/tracker";
type Workspace = {
  applications: Application[];
  templates: Template[];
  contacts: Contact[];
  interviews: Interview[];
  dailyLogs: DailyLog[];
  targets: DailyTargets;
  needsMigration: boolean;
  saveContact: (
    input: ContactInput | Partial<ContactInput>,
    id?: string,
  ) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  saveInterview: (input: InterviewInput, id?: string) => Promise<void>;
  deleteInterview: (id: string) => Promise<void>;
  saveDailyLog: (input: DailyLogInput) => Promise<void>;
  deleteDailyLog: (id: string) => Promise<void>;
  saveTargets: (input: DailyTargets) => Promise<void>;
  importBundle: (bundle: TrackerBundle) => Promise<void>;
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
  const router = useRouter();
  const [activeUserId, setActiveUserId] = useState<string | null>(userId);
  const activeUserRef = useRef<string | null>(userId);
  const [applications, setApplications] = useState<Application[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [targets, setTargets] = useState<DailyTargets>(DEFAULT_TARGETS);
  const [needsMigration, setNeedsMigration] = useState(false);
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
          let migrationMissing = false;
          const readAll = async (
            table:
              | "applications"
              | "templates"
              | "contacts"
              | "interviews"
              | "daily_logs",
          ) => {
            const rows: unknown[] = [];
            for (let from = 0; ; from += 1000) {
              const { data, error } = await supabase
                .from(table)
                .select("*")
                .eq("user_id", userId)
                .order(table === "templates" ? "title" : "created_at", {
                  ascending: table === "templates",
                })
                .order("id")
                .range(from, from + 999);
              if (error) {
                if (
                  ["contacts", "interviews", "daily_logs"].includes(table) &&
                  ["42P01", "PGRST205"].includes(error.code)
                ) {
                  migrationMissing = true;
                  return [];
                }
                throw error;
              }
              rows.push(...data);
              if (data.length < 1000) return rows;
            }
          };
          const [apps, temps, people, sessions, logs, preferences] =
            await Promise.all([
              readAll("applications"),
              readAll("templates"),
              readAll("contacts"),
              readAll("interviews"),
              readAll("daily_logs"),
              supabase
                .from("settings")
                .select("daily_targets")
                .eq("user_id", userId)
                .maybeSingle(),
            ]);
          if (preferences.error) {
            if (["42P01", "PGRST205"].includes(preferences.error.code))
              migrationMissing = true;
            else throw preferences.error;
          }
          return {
            apps: apps as Application[],
            templates: temps as Template[],
            contacts: people as Contact[],
            interviews: sessions as Interview[],
            dailyLogs: logs as DailyLog[],
            targets: (preferences.data?.daily_targets ||
              DEFAULT_TARGETS) as DailyTargets,
            needsMigration:
              migrationMissing ||
              (apps.length > 0 && !("screening" in (apps[0] as object))),
          };
        })
        .then((data) => {
          if (activeUserRef.current !== userId) return;
          setError("");
          setApplications(data.apps);
          setTemplates(data.templates);
          setContacts(data.contacts);
          setInterviews(data.interviews);
          setDailyLogs(data.dailyLogs);
          setTargets(data.targets);
          setNeedsMigration(data.needsMigration);
        })
        .catch((e) => {
          if (activeUserRef.current === userId) setError(errorMessage(e));
        })
        .finally(() => {
          if (activeUserRef.current === userId) setLoading(false);
        }),
    [userId],
  );
  useEffect(() => {
    if (activeUserId === userId) void load();
  }, [load, activeUserId, userId]);
  useEffect(() => {
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id || null;
      activeUserRef.current = nextUserId;
      setActiveUserId(nextUserId);
      if (nextUserId === userId) return;
      // Clear the previous account's records when another tab switches accounts.
      setApplications([]);
      setTemplates([]);
      setContacts([]);
      setInterviews([]);
      setDailyLogs([]);
      setTargets(DEFAULT_TARGETS);
      setToast("");
      setError("");
      setLoading(true);
      if (!nextUserId) router.replace("/login");
      router.refresh();
    });
    return () => subscription.unsubscribe();
  }, [userId, router]);
  function requireActiveAccount() {
    if (activeUserRef.current !== userId)
      throw new Error("Your account changed. Please sign in again.");
  }
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    await load();
  }, [load]);
  async function saveApplication(
    input: ApplicationInput | Partial<ApplicationInput>,
    id?: string,
  ) {
    requireActiveAccount();
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
    requireActiveAccount();
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
    requireActiveAccount();
    // One insert is atomic: a bad row cannot leave a partially imported CSV.
    const { error } = await createClient()
      .from("applications")
      .insert(rows.map((row) => ({ ...row, user_id: userId })));
    if (error) throw error;
    await reload();
  }
  async function saveTemplate(input: TemplateInput, id?: string) {
    requireActiveAccount();
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
    requireActiveAccount();
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
  async function saveRow<T>(
    table: "contacts" | "interviews" | "daily_logs",
    input: object,
    id?: string,
  ): Promise<T> {
    requireActiveAccount();
    const db = createClient();
    const result =
      table === "daily_logs"
        ? await db
            .from(table)
            .upsert(
              { ...input, user_id: userId },
              { onConflict: "user_id,activity_on" },
            )
            .select()
            .single()
        : id
          ? await db
              .from(table)
              .update(input)
              .eq("id", id)
              .eq("user_id", userId)
              .select()
              .single()
          : await db
              .from(table)
              .insert({ ...input, user_id: userId })
              .select()
              .single();
    if (result.error) throw result.error;
    return result.data as T;
  }
  async function deleteRow(
    table: "contacts" | "interviews" | "daily_logs",
    id: string,
  ) {
    requireActiveAccount();
    const { error } = await createClient()
      .from(table)
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .single();
    if (error) throw error;
  }
  async function saveContact(
    input: ContactInput | Partial<ContactInput>,
    id?: string,
  ) {
    const row = await saveRow<Contact>("contacts", input, id);
    setContacts((prev) =>
      id ? prev.map((c) => (c.id === id ? row : c)) : [row, ...prev],
    );
  }
  async function deleteContact(id: string) {
    await deleteRow("contacts", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }
  async function saveInterview(input: InterviewInput, id?: string) {
    const row = await saveRow<Interview>("interviews", input, id);
    setInterviews((prev) =>
      id ? prev.map((c) => (c.id === id ? row : c)) : [row, ...prev],
    );
  }
  async function deleteInterview(id: string) {
    await deleteRow("interviews", id);
    setInterviews((prev) => prev.filter((c) => c.id !== id));
  }
  async function saveDailyLog(input: DailyLogInput) {
    const row = await saveRow<DailyLog>("daily_logs", input);
    setDailyLogs((prev) => [
      row,
      ...prev.filter((log) => log.activity_on !== row.activity_on),
    ]);
  }
  async function deleteDailyLog(id: string) {
    await deleteRow("daily_logs", id);
    setDailyLogs((prev) => prev.filter((log) => log.id !== id));
  }
  async function saveTargets(input: DailyTargets) {
    requireActiveAccount();
    const { error } = await createClient()
      .from("settings")
      .upsert(
        { user_id: userId, daily_targets: input },
        { onConflict: "user_id" },
      );
    if (error) throw error;
    setTargets(input);
  }
  async function importBundle(bundle: TrackerBundle) {
    requireActiveAccount();
    // Bind an import to the account that opened its preview, even across tabs.
    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedUserId: userId, bundle }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Import failed. Please try again.");
    await reload();
  }
  return (
    <Context.Provider
      value={{
        applications,
        templates,
        contacts,
        interviews,
        dailyLogs,
        targets,
        needsMigration,
        saveContact,
        deleteContact,
        saveInterview,
        deleteInterview,
        saveDailyLog,
        deleteDailyLog,
        saveTargets,
        importBundle,
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
      {activeUserId === userId ? (
        children
      ) : (
        <main className="loading-state" role="status">
          <p>Updating your private workspace…</p>
        </main>
      )}
      {activeUserId === userId &&
        toast &&
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
