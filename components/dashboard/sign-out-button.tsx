"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      className="text-brand-brown-soft hover:bg-brand-yellow-light hover:text-foreground w-full justify-start gap-3 px-3"
      onClick={() => signOut({ redirectTo: "/login" })}
    >
      <LogOut aria-hidden className="size-5 shrink-0" strokeWidth={1.5} />
      Sign out
    </Button>
  );
}
