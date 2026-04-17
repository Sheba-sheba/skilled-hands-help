import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

const Navbar = () => {
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
          <a href="#services" className="text-muted-foreground transition-colors hover:text-foreground">Services</a>
          <a href="#how" className="text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <a href="#pros" className="text-muted-foreground transition-colors hover:text-foreground">Pros</a>
          <a href="#join" className="text-muted-foreground transition-colors hover:text-foreground">Join as Pro</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button>
          <Button variant="hero" size="sm">Book a Pro</Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
