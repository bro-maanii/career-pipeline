import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <h1>This page is off the path.</h1>
      <p>Head back to your workspace.</p>
      <Link className="btn btn-primary" href="/today">
        Back to Today
      </Link>
    </main>
  );
}
