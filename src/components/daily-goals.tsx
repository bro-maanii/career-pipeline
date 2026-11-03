"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useWorkspace } from "./workspace-provider";
import { dailyMetrics, METRIC_LABELS } from "@/lib/tracker";
import type { DailyTargets } from "@/lib/types";
export function DailyGoals({ compact = false }: { compact?: boolean }) {
  const { today, applications, contacts, dailyLogs, targets } = useWorkspace();
  const counts = dailyMetrics(today, applications, contacts, dailyLogs);
  return (
    <section
      className={`daily-goals ${compact ? "daily-goals-compact" : ""}`}
      aria-label="Daily targets"
      data-tour="daily-goals"
    >
      <div className="goals-title">
        <div>
          <span className="eyebrow">TODAY’S MOMENTUM</span>
          <h2>Small actions add up.</h2>
        </div>
        <Link className="text-link" href="/activity">
          Daily activity <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="goal-grid">
        {(Object.keys(targets) as (keyof DailyTargets)[]).map((key) => (
          <div className="goal-item" key={key}>
            <div>
              <span>{METRIC_LABELS[key]}</span>
              <strong>
                {counts[key]} <small>/ {targets[key] || "off"}</small>
              </strong>
            </div>
            <progress
              max={Math.max(targets[key], 1)}
              value={targets[key] ? Math.min(counts[key], targets[key]) : 0}
              aria-label={`${METRIC_LABELS[key]}: ${counts[key]} of ${targets[key]}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
