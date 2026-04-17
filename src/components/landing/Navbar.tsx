import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Wrench, X } from "lucide-react";

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#how", label: "How it works" },
  { href: "#pros", label: "Pros" },
  { href: "#join", label: "Join as Pro" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="font-display text-xl tracking-tight">Toolbox</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button>
          <Button variant="hero" size="sm" className="hidden sm:inline-flex">Book a Pro</Button>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] border-l border-white/10 bg-primary p-0 text-primary-foreground sm:w-96 [&>button]:hidden">
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <span className="font-display text-xl">Toolbox</span>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground" aria-label="Close menu">
                    <X className="h-5 w-5" />
                  </Button>
                </SheetClose>
              </div>

              <nav className="flex flex-col gap-1 px-4 py-6">
                {navLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-4 font-display text-2xl tracking-tight text-primary-foreground/90 transition-colors hover:bg-white/5 hover:text-accent"
                  >
                    {l.label}
                    <span className="text-accent">→</span>
                  </a>
                ))}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 space-y-3 border-t border-white/10 bg-primary p-6">
                <Button variant="hero" size="lg" className="w-full">Book a Pro</Button>
                <Button variant="dark" size="lg" className="w-full">Sign in</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
