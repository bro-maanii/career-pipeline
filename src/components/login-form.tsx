"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  Check,
  LoaderCircle,
  MailCheck,
  LockKeyhole,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signupValidation } from "@/lib/auth";
export function LoginForm({
  configured,
  mode = "login",
  notice = "",
}: {
  configured: boolean;
  mode?: "login" | "signup";
  notice?: string;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const email = String(form.get("email")).trim();
      const password = String(form.get("password"));
      if (isSignup) {
        const validation = signupValidation(
          password,
          String(form.get("confirmPassword")),
        );
        if (validation) throw new Error(validation);
        const { data, error } = await createClient().auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setConfirmationEmail(email);
          setPending(false);
          return;
        }
      } else {
        const { error } = await createClient().auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.replace("/today");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to access your account. Please try again.",
      );
      setPending(false);
    }
  }
  return (
    <main className="login-layout">
      <section className="login-story">
        <Link href="/" className="brand">
          <span className="brand-symbol">
            <ChartNoAxesColumnIncreasing size={23} />
          </span>
          career pipeline<span className="brand-period">.</span>
        </Link>
        <div className="login-story-copy">
          <span className="eyebrow">A LITTLE MOMENTUM, EVERY DAY</span>
          <h1>
            Your next chapter
            <br />
            starts with
            <br />
            <span>one follow-up.</span>
          </h1>
          <p>
            A calmer place for your job search. Keep track of opportunities,
            start conversations, and know exactly what to do next.
          </p>
          <div className="story-check">
            <Check size={17} /> Every application. Every conversation. One
            place.
          </div>
        </div>
        <p className="login-footer">Built for your search. At your pace.</p>
      </section>
      <section className="login-form-side">
        <div className="login-form-card">
          <span className="eyebrow">YOUR PRIVATE WORKSPACE</span>
          <h2>{isSignup ? "Your own workspace." : "Welcome back."}</h2>
          <p className="muted">
            {isSignup
              ? "Create an account for your own job search."
              : "Sign in to your applications and conversations."}
          </p>
          {!configured && (
            <div className="setup-note">
              <strong>Let’s connect your workspace</strong>
              <p>
                Add your Supabase URL and anon key to <code>.env.local</code>,
                run <code>supabase/schema.sql</code>, then restart the app. The
                README has the steps.
              </p>
            </div>
          )}
          {notice && (
            <p className="error-box" role="alert">
              {notice}
            </p>
          )}
          {confirmationEmail ? (
            <div className="signup-success" role="status">
              <span className="signup-success-icon">
                <MailCheck size={27} />
              </span>
              <h3>Check your email</h3>
              <p>
                Look for a confirmation link at{" "}
                <strong>{confirmationEmail}</strong>. Confirm your email to open
                your private workspace.
              </p>
              <p>
                If you already have an account, sign in with your existing
                password. No confirmation email may be sent for an existing
                account.
              </p>
              <Link className="btn btn-primary full-width" href="/login">
                Back to sign in <ArrowRight size={17} />
              </Link>
              <button
                type="button"
                className="btn btn-quiet full-width"
                onClick={() => setConfirmationEmail("")}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={login} className="login-form">
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete={isSignup ? "email" : "username"}
                  required
                  disabled={!configured || pending}
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  placeholder={
                    isSignup ? "Create a password" : "Enter your password"
                  }
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={isSignup ? 8 : undefined}
                  required
                  disabled={!configured || pending}
                />
              </label>
              {isSignup && (
                <>
                  <p className="field-hint signup-password-hint">
                    At least 8 characters. Use a password unique to this
                    account.
                  </p>
                  <label>
                    Confirm password
                    <input
                      name="confirmPassword"
                      type="password"
                      placeholder="Enter your password again"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      disabled={!configured || pending}
                    />
                  </label>
                </>
              )}
              {error && (
                <p className="error-box" role="alert">
                  {error}
                </p>
              )}
              <button
                className="btn btn-primary login-submit"
                disabled={!configured || pending}
              >
                {pending ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <>
                    {isSignup
                      ? "Create your account"
                      : "Sign in to your workspace"}{" "}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
          {!confirmationEmail && (
            <p className="auth-switch">
              {isSignup ? "Already have an account?" : "New here?"}{" "}
              <Link href={isSignup ? "/login" : "/signup"}>
                {isSignup ? "Sign in" : "Create an account"}
              </Link>
            </p>
          )}
          <p className="login-help">
            <LockKeyhole size={13} /> Your applications, contacts, notes, and
            templates
            <br />
            stay private to your account.
          </p>
        </div>
      </section>
    </main>
  );
}
