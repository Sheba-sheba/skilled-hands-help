import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Wrench, X, LogOut, User as UserIcon, HardHat } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/#services", label: "Services" },
  { href: "/#how", label: "How it works" },
  { href: "/#pros", label: "Pros" },
  { href: "/ai-toolbox", label: "AI Toolbox" },
  { href: "/#join", label: "Join as Pro" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, roles, signOut } = useAuth();

  const initials = (user?.user_metadata?.full_name as string | undefined)
    ?.split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?";

  const isProvider = roles.includes("provider");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="font-display text-xl tracking-tight">Toolbox</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 transition-colors hover:bg-secondary">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-semibold sm:inline">
                    {(user.user_metadata?.full_name as string)?.split(" ")[0] ?? "Account"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  {isProvider ? <HardHat className="h-4 w-4 text-accent" /> : <UserIcon className="h-4 w-4 text-accent" />}
                  {isProvider ? "Pro account" : "Customer"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/bookings">My bookings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button variant="hero" size="sm" className="hidden sm:inline-flex" asChild>
                <Link to="/auth">Book a Pro</Link>
              </Button>
            </>
          )}

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
                {user ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-accent text-accent-foreground">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{(user.user_metadata?.full_name as string) ?? user.email}</p>
                        <p className="text-xs text-primary-foreground/60">{isProvider ? "Pro account" : "Customer"}</p>
                      </div>
                    </div>
                    <Button variant="dark" size="lg" className="w-full" onClick={() => { signOut(); setOpen(false); }}>
                      <LogOut /> Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="hero" size="lg" className="w-full" asChild>
                      <Link to="/auth" onClick={() => setOpen(false)}>Book a Pro</Link>
                    </Button>
                    <Button variant="dark" size="lg" className="w-full" asChild>
                      <Link to="/auth" onClick={() => setOpen(false)}>Sign in</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
