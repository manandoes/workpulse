import Link from "next/link";
import { BrandMark } from "@/components/marketing/brand-mark";
import { Button } from "@/components/ui/button";

/**
 * Styled 404 for any unmatched route (root layout only — no sidebar/header
 * to borrow, since this can render for a path outside every route group).
 * Replaces Next's default 404, which every existing `notFound()` call
 * (~26 pages) previously fell through to.
 */
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <BrandMark />
      <h1 className="text-h2 text-brand-brown font-semibold">Page not found</h1>
      <p className="text-text-secondary max-w-md">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <Button asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
