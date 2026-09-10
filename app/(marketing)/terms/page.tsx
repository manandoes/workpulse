import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/marketing/page-placeholder";

export const metadata: Metadata = {
  title: "Terms of Service — Talking Lens Media",
  description: "The terms that govern use of Talking Lens Media.",
};

export default function TermsPage() {
  return (
    <PagePlaceholder
      title="Terms of Service"
      description="These terms will set out what you can expect from Talking Lens Media and what we ask of you in return."
      note="Placeholder page. The terms have not been drafted yet and must be written or reviewed by a qualified professional before launch."
    />
  );
}
