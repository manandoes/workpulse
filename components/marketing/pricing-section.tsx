import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/marketing/section";

/**
 * Pricing placeholder (PRD.md section 6.0 — "placeholder/plans structure for
 * v1"). The plan structure is real; the amounts are indicative and flagged as
 * such on the page until commercial pricing is confirmed.
 *
 * Currency is INR, the default in PRD.md section 11.
 */
const PLANS = [
  {
    name: "Starter",
    price: "₹199",
    cadence: "per user / month",
    description: "For small teams putting their operations in one place.",
    features: [
      "Up to 15 employees",
      "Projects, tasks, and requests",
      "Employee self-service",
      "Email support",
    ],
    cta: "Get started",
    featured: false,
  },
  {
    name: "Growth",
    price: "₹399",
    cadence: "per user / month",
    description: "For agencies that need workload and performance visibility.",
    features: [
      "Unlimited employees",
      "Workload intelligence",
      "Performance tracking & goals",
      "Client financials & margins",
      "Early-warning alerts",
    ],
    cta: "Get started",
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    cadence: "talk to us",
    description: "For larger agencies with custom process and security needs.",
    features: [
      "Everything in Growth",
      "Custom alert thresholds",
      "Onboarding & migration help",
      "Priority support",
    ],
    cta: "Contact us",
    featured: false,
  },
] as const;

export function PricingSection() {
  return (
    <Section id="pricing" className="bg-surface">
      <SectionHeading
        eyebrow="Pricing"
        title="Simple plans that grow with your team"
        description="Every plan includes your own isolated company workspace."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "border-border bg-surface flex flex-col gap-6 rounded-xl border p-6",
              plan.featured && "border-brand-yellow"
            )}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-h3 text-brand-brown font-semibold">
                  {plan.name}
                </h3>
                {plan.featured ? (
                  <span className="bg-brand-yellow-light text-brand-brown text-meta rounded-full px-2.5 py-1 font-medium">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="text-text-secondary">{plan.description}</p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-brand-brown text-display font-semibold">
                {plan.price}
              </span>
              <span className="text-text-secondary text-meta">
                {plan.cadence}
              </span>
            </div>

            <ul className="flex flex-1 flex-col gap-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check
                    aria-hidden
                    className="text-brand-brown-soft mt-0.5 size-4 shrink-0"
                    strokeWidth={1.5}
                  />
                  <span className="text-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              size="lg"
              variant={plan.featured ? "default" : "outline"}
            >
              <Link href={plan.price === "Custom" ? "/contact" : "/register"}>
                {plan.cta}
                <span className="sr-only">{` — ${plan.name} plan`}</span>
              </Link>
            </Button>
          </div>
        ))}
      </div>

      <p className="text-text-secondary text-meta mt-8 text-center">
        Prices shown are indicative while we finalise our plans. Nothing is
        charged today.
      </p>
    </Section>
  );
}
