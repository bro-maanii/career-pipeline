"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-page">
      <h1>Let’s try that again.</h1>
      <p>
        Something interrupted your workspace. Your saved data is still in
        Supabase.
      </p>
      <button className="btn btn-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
