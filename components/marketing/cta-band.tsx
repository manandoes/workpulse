import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Closing conversion band. Brand-brown surface with cream text, mirroring the
 * app sidebar treatment in Design.md section 6.
 */
export function CtaBand() {
  return (
    <section className="w-full px-6 py-16 sm:py-20">
      <div className="bg-brand-brown mx-auto flex w-full max-w-[1200px] flex-col items-start gap-6 rounded-xl px-8 py-12 sm:px-12">
        <h2 className="text-h1 text-background max-w-2xl font-semibold text-balance">
          Stop guessing who is overloaded and what is falling behind.
        </h2>
        <p className="text-brand-brown-light max-w-xl">
          Set up your company workspace, invite your team, and see your whole
          agency on one screen.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Get started</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="text-brand-brown-light hover:bg-brand-brown-soft/40 hover:text-background"
          >
            <Link href="/login/company">Company Login</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
