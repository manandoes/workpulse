import {
  ClipboardCheck,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/section";

/**
 * The seven core modules listed in PRD.md section 6.0.
 *
 * Design.md section 8: icon + short heading + one-line description in a
 * 3-column grid, with no card borders (flatter than the app UI).
 */
const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Company dashboard",
    description:
      "Live counts, overdue work, pending approvals, and early warnings on one screen.",
  },
  {
    icon: Users,
    title: "Employee management",
    description:
      "Profiles, departments, reporting lines, and role-based access for admins and HR.",
  },
  {
    icon: FolderKanban,
    title: "Task & project management",
    description:
      "Projects, tasks, deadlines, and priorities in board, list, or calendar views.",
  },
  {
    icon: Gauge,
    title: "Workload intelligence",
    description:
      "See who is overloaded and who is free before you assign the next task.",
  },
  {
    icon: TrendingUp,
    title: "Performance tracking",
    description:
      "Continuous scoring from delivery, goals, and manager feedback — not once a year.",
  },
  {
    icon: ClipboardCheck,
    title: "Employee requests",
    description:
      "Leave, reimbursements, equipment, and WFH requests with a clear approval trail.",
  },
  {
    icon: Wallet,
    title: "Client financials",
    description:
      "Project value, cost, and margin per client, rolled up across the agency.",
  },
] as const;

export function FeaturesSection() {
  return (
    <Section id="features" className="bg-surface">
      <SectionHeading
        eyebrow="Features"
        title="Everything your agency runs on, in one place"
        description="Stop stitching together spreadsheets, a project tool, and a chat thread for approvals."
      />

      <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="flex flex-col gap-3">
            <feature.icon
              aria-hidden
              className="text-brand-brown-soft size-5"
              strokeWidth={1.5}
            />
            <h3 className="text-h3 text-brand-brown font-semibold">
              {feature.title}
            </h3>
            <p className="text-text-secondary">{feature.description}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
