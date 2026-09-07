import { Section, SectionHeading } from "@/components/marketing/section";

/**
 * The four-step flow described in PRD.md section 6.0:
 * add your team, assign projects & tasks, track workload & performance,
 * approve requests — all from one dashboard.
 */
const STEPS = [
  {
    title: "Add your team",
    description:
      "Create your company workspace and invite employees. They set their own password from the invite link.",
  },
  {
    title: "Assign projects & tasks",
    description:
      "Set up clients and projects, then break them into tasks with owners, deadlines, and effort estimates.",
  },
  {
    title: "Track workload & performance",
    description:
      "Workload percentages and performance scores update as work moves, so problems surface early.",
  },
  {
    title: "Approve requests",
    description:
      "Leave, reimbursements, and equipment requests arrive in one queue instead of your inbox.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <Section id="how-it-works" className="bg-background">
      <SectionHeading
        eyebrow="How it works"
        title="Up and running in four steps"
      />

      <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3">
            <span
              aria-hidden
              className="bg-brand-yellow-light text-brand-brown flex size-8 items-center justify-center rounded-lg font-semibold"
            >
              {index + 1}
            </span>
            <h3 className="text-h3 text-brand-brown font-semibold">
              <span className="sr-only">{`Step ${index + 1}: `}</span>
              {step.title}
            </h3>
            <p className="text-text-secondary">{step.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
