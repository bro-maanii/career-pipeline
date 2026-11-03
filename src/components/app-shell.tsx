"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChartNoAxesColumnIncreasing,
  CalendarDays,
  BriefcaseBusiness,
  Files,
  LogOut,
  ArrowUpRight,
  Users,
  BookOpen,
  Activity,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace, errorMessage } from "./workspace-provider";
import { MigrationNotice } from "./ui";
import { TutorialButton, TutorialProvider } from "./tutorial";
const navigation = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/applications", label: "Applications", icon: BriefcaseBusiness },
  { href: "/contacts", label: "Outreach contacts", icon: Users },
  { href: "/interviews", label: "Interview journal", icon: BookOpen },
  { href: "/activity", label: "Daily activity", icon: Activity },
  { href: "/funnel", label: "Funnel & sources", icon: Filter },
  { href: "/templates", label: "Message templates", icon: Files },
];
export function AppShell({
  email,
  userId,
  children,
}: {
  email: string;
  userId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { notify, needsMigration, loading } = useWorkspace();
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.replace("/login");
      router.refresh();
    } catch (e) {
      notify(errorMessage(e));
      setPending(false);
    }
  }
  return (
    <TutorialProvider mode="workspace" userId={userId} loading={loading}>
      <div className="app-layout" data-tour-root="workspace">
        <aside className="sidebar">
          <Link href="/" className="brand">
            <span className="brand-symbol">
              <ChartNoAxesColumnIncreasing size={22} />
            </span>
            <span>
              career pipeline<span className="brand-period">.</span>
            </span>
          </Link>
          <div className="workspace-label">
            <span className="workspace-dot" /> PRIVATE WORKSPACE
          </div>
          <nav aria-label="Main navigation">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                data-tour={`nav-${href.slice(1)}`}
                className={`nav-link ${pathname === href ? "active" : ""}`}
                aria-current={pathname === href ? "page" : undefined}
              >
                <Icon size={19} />
                {label}
                {pathname === href && <span className="nav-dot" />}
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <ArrowUpRight size={24} />
              <strong>
                Small steps.
                <br />
                Real opportunities.
              </strong>
              <p>
                Keep showing up.
                <br />
                The right conversation is ahead.
              </p>
            </div>
            <div className="profile" data-tour="account-profile">
              <span className="avatar profile-avatar">
                {email.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>My workspace</strong>
                <span title={email}>{email}</span>
              </div>
              <button
                className="icon-btn"
                onClick={logout}
                disabled={pending}
                aria-label={pending ? "Signing out" : "Log out"}
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>
        <div className="workspace-main">
          <div className="topbar">
            <span>
              My workspace <span className="breadcrumb-slash">/</span>{" "}
              <strong>
                {navigation.find((item) => item.href === pathname)?.label ||
                  "Workspace"}
              </strong>
            </span>
            <div className="tutorial-workspace-actions">
              <TutorialButton className="btn btn-secondary tutorial-launch" />
              <span className="private-label">
                <span className="workspace-dot" /> Just for you
              </span>
            </div>
          </div>
          <div className="workspace-tutorial-mobile">
            <TutorialButton />
          </div>
          <main className="page-content">
            {needsMigration && <MigrationNotice />}
            {children}
          </main>
          <footer className="workspace-footer">
            One step closer to your next chapter.
          </footer>
        </div>
      </div>
    </TutorialProvider>
  );
}
