import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "@/components/marketing/product-preview";

/**
 * Hero section (PRD.md section 6.0, Design.md section 8): cream background,
 * large brand-brown headline, brand-yellow primary CTA, product mock.
 */
export function Hero() {
  return (
    <section className="bg-background w-full px-6 pt-16 pb-16 sm:pt-24 sm:pb-20">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <p className="text-meta text-brand-brown-soft font-medium tracking-wide uppercase">
            Agency operations platform
          </p>

          <h1 className="text-display text-brand-brown font-semibold text-balance">
            Run your whole agency from one dashboard.
          </h1>

          <p className="text-text-secondary max-w-xl text-pretty">
            An all-in-one operating dashboard for agencies that connects
            employees, projects, tasks, performance, expenses, and internal
            operations in one place.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/#how-it-works">See how it works</Link>
            </Button>
          </div>

          <p className="text-meta text-text-secondary">
            Company owners and admins sign up here. Employees are invited by
            their company.
          </p>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
