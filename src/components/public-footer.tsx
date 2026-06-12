import { Link } from "@tanstack/react-router";
import { Truck } from "lucide-react";

import { cn } from "@/lib/utils";

type PublicFooterTone = "dark" | "light";

const FOOTER_STYLES: Record<
  PublicFooterTone,
  {
    border: string;
    title: string;
    text: string;
    link: string;
    badge: string;
  }
> = {
  dark: {
    border: "border-white/5",
    title: "text-white",
    text: "text-slate-500",
    link: "text-slate-400 hover:text-white",
    badge: "bg-[#FACC15]",
  },
  light: {
    border: "border-border",
    title: "text-foreground",
    text: "text-muted-foreground",
    link: "text-muted-foreground hover:text-foreground",
    badge: "bg-primary text-primary-foreground",
  },
};

export function PublicFooter({
  tone = "dark",
  className,
  links,
}: {
  tone?: PublicFooterTone;
  className?: string;
  links?: { label: string; href?: string; to?: string }[];
}) {
  const s = FOOTER_STYLES[tone];

  return (
    <footer className={cn("border-t px-4 py-10 sm:px-6", s.border, className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", s.badge)}>
            <Truck className={cn("h-4 w-4", tone === "dark" ? "text-black" : "text-primary-foreground")} />
          </div>
          <div>
            <div className={cn("text-sm font-bold tracking-tight", s.title)}>Hooked</div>
            <div className={cn("text-[11px] uppercase tracking-widest", s.text)}>
              AI Tow Dispatch
            </div>
          </div>
        </div>

        <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-xs", s.text)}>
          {links?.length ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {links.map((link) =>
                link.to ? (
                  <Link key={link.label} to={link.to} className={s.link}>
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href ?? "#"} className={s.link}>
                    {link.label}
                  </a>
                ),
              )}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacy" className={s.link}>
              Privacy Policy
            </Link>
            <Link to="/terms" className={s.link}>
              Terms of Service
            </Link>
            <a href="mailto:support@hookaidashboard.com" className={s.link}>
              Contact / Support
            </a>
          </div>
        </div>

        <p className={cn("text-xs", s.text)}>© {new Date().getFullYear()} Hooked. All rights reserved.</p>
      </div>
    </footer>
  );
}
