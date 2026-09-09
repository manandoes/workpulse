import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { navigationFor } from "@/lib/permissions";
import { BrandMark } from "@/components/marketing/brand-mark";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Toaster } from "@/components/ui/sonner";

/**
 * Authenticated app shell (Architecture.md section 6 — one shell that adapts to
 * the role, rather than separate apps per role).
 *
 * Middleware already blocks unauthenticated requests. This check is deliberate
 * defence in depth: the layout renders tenant data, so it verifies the session
 * itself rather than trusting the edge (Rules.md section 3).
 */
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const actor = {
    id: session.user.id,
    companyId: session.user.companyId,
    role: session.user.role,
    accountType: session.user.accountType,
  };

  const navigation = navigationFor(actor);
  const roleLabel =
    actor.accountType === "employee" ? "Employee" : session.user.role;

  return (
    <div className="flex min-h-full flex-1">
      {/* Design.md section 5: fixed 240px sidebar, brand-brown with cream text.
          Sticky + h-screen keeps it pinned to the viewport height instead of
          stretching (and scrolling away) with tall main content. */}
      <aside className="bg-sidebar hidden w-60 shrink-0 flex-col justify-between p-4 md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto">
        <div className="flex flex-col gap-8">
          <Link href={navigation[0].href} aria-label="WorkPulse home">
            <BrandMark labelClassName="text-background" />
          </Link>
          <SidebarNav items={navigation} />
        </div>

        <div className="flex flex-col gap-3">
          <NotificationBell className="self-start" />
          <div className="px-3">
            <p className="text-background font-medium">{session.user.name}</p>
            <p className="text-brand-brown-light text-meta">
              {roleLabel} · {session.user.companyName}
            </p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact header carrying the nav on small screens. */}
        <header className="border-border bg-surface flex items-center justify-between gap-4 border-b px-6 py-3 md:hidden">
          <BrandMark />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <SignOutButton />
          </div>
        </header>

        <nav
          aria-label="Main"
          className="border-border bg-surface flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-text-secondary hover:text-brand-brown rounded-lg px-3 py-1.5 whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-8">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
