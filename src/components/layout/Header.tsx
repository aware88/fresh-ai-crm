'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl">AI CRM</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/features" className="transition-colors hover:text-foreground/80">
            Features
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground/80">
            Pricing
          </Link>
          <Link href="/about" className="transition-colors hover:text-foreground/80">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button>Enter Dashboard</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
