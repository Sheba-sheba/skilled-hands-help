import { Link } from "react-router-dom";
import { Paintbrush, Bug, ArrowUpRight, type LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

interface ServiceCard {
  href: string | null;
  icon: LucideIcon;
  name: string;
  desc: string;
  from: string;
  tone: string;
}

// Bookable categories link to /providers/:category; "coming soon" categories
// keep their landing card but don't link.
const services: ServiceCard[] = [
  ...CATEGORIES.map((c) => ({
    href: `/providers/${c.slug}`,
    icon: c.icon,
    name: c.label === "Plumber" ? "Plumbing" : c.label === "Electrician" ? "Electrical" : c.label === "Cleaner" ? "Cleaning" : c.label,
    desc: c.description,
    from: c.slug === "electrician" ? "$65" : c.slug === "plumber" ? "$49" : c.slug === "cleaner" ? "$59" : "$39",
    tone: c.tone,
  })),
  { href: null, icon: Paintbrush, name: "Painting", desc: "Coming soon", from: "$120", tone: "from-rose-500/20 to-rose-500/5" },
  { href: null, icon: Bug, name: "Pest Control", desc: "Coming soon", from: "$89", tone: "from-violet-500/20 to-violet-500/5" },
];

const Services = () => {
  return (
    <section id="services" className="relative py-24 md:py-32">
      <div className="container">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">What we fix</p>
            <h2 className="font-display text-4xl text-balance sm:text-5xl lg:text-6xl">
              Every job, one app.
            </h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Four core trades, hundreds of vetted pros. Tap a category and we'll match you with someone who can be at your door today.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const inner = (
              <>
                <div className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${s.tone} blur-2xl transition-opacity group-hover:opacity-100`} />
                <div className="relative flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-accent" />
                </div>
                <h3 className="mt-6 font-display text-2xl">{s.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                <div className="mt-5 flex items-baseline gap-1.5 border-t border-dashed border-border pt-4">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">from</span>
                  <span className="font-display text-xl">{s.from}</span>
                </div>
              </>
            );

            const className = "group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant";

            return s.href ? (
              <Link key={s.name} to={s.href} className={className} style={{ animationDelay: `${i * 60}ms` }}>
                {inner}
              </Link>
            ) : (
              <div key={s.name} className={`${className} cursor-default opacity-70`} style={{ animationDelay: `${i * 60}ms` }}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
