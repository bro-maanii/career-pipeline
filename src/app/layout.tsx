import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Career Pipeline · Your next chapter",
  description:
    "A simple personal job search tracker. Applications, conversations, and follow-ups in one place.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
