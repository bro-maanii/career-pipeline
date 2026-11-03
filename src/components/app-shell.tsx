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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace, errorMessage } from "./workspace-provider";
export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { notify } = useWorkspace();
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
    <div className="app-layout">
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
          <span className="workspace-dot" /> PERSONAL WORKSPACE
        </div>
        <nav aria-label="Main navigation">
          {[
            { href: "/", label: "Today", icon: CalendarDays },
            {
              href: "/applications",
              label: "Applications",
              icon: BriefcaseBusiness,
            },
            { href: "/templates", label: "Message templates", icon: Files },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
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
          <div className="profile">
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
              {pathname === "/"
                ? "Today"
                : pathname === "/applications"
                  ? "Applications"
                  : "Message templates"}
            </strong>
          </span>
          <span className="private-label">
            <span className="workspace-dot" /> Just for you
          </span>
        </div>
        <main className="page-content">{children}</main>
        <footer className="workspace-footer">
          One step closer to your next chapter.
        </footer>
      </div>
    </div>
  );
}
