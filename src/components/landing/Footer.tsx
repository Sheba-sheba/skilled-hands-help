import { Wrench } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wrench className="h-5 w-5" />
              </div>
              <span className="font-display text-xl">Toolbox</span>
            </a>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Bridging the gap between great tradespeople and the people who need them. Built with respect for the work.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider">Services</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Plumbing</a></li>
              <li><a href="#" className="hover:text-foreground">Electrical</a></li>
              <li><a href="#" className="hover:text-foreground">Handyman</a></li>
              <li><a href="#" className="hover:text-foreground">Cleaning</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">About</a></li>
              <li><a href="#join" className="hover:text-foreground">Join as Pro</a></li>
              <li><a href="#" className="hover:text-foreground">Help center</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Toolbox. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
