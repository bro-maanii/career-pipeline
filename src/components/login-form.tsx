"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  Check,
  LoaderCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      });
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to sign in. Please try again.",
      );
      setPending(false);
    }
  }
  return (
    <main className="login-layout">
      <section className="login-story">
        <a href="/login" className="brand">
          <span className="brand-symbol">
            <ChartNoAxesColumnIncreasing size={23} />
          </span>
          career pipeline<span className="brand-period">.</span>
        </a>
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
          <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
          <h2>Welcome back.</h2>
          <p className="muted">A new day. A few small steps forward.</p>
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
          <form onSubmit={login} className="login-form">
            <label>
              Email address
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="username"
                required
                disabled={!configured || pending}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={!configured || pending}
              />
            </label>
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
                  Sign in to your workspace <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <p className="login-help">
            Your private space. Sign in with the account
            <br />
            you created in Supabase.
          </p>
        </div>
      </section>
    </main>
  );
}
