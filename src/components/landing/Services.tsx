import { Wrench, Zap, Hammer, Sparkles, Paintbrush, Bug, ArrowUpRight } from "lucide-react";

const services = [
  { icon: Wrench, name: "Plumbing", desc: "Leaks, installs, drains", from: "$49", tone: "from-blue-500/20 to-blue-500/5" },
  { icon: Zap, name: "Electrical", desc: "Wiring, fixtures, panels", from: "$65", tone: "from-accent/30 to-accent/5" },
  { icon: Hammer, name: "Handyman", desc: "Repairs, mounting, assembly", from: "$39", tone: "from-amber-500/20 to-amber-500/5" },
  { icon: Sparkles, name: "Cleaning", desc: "Deep, regular, move-out", from: "$59", tone: "from-emerald-500/20 to-emerald-500/5" },
  { icon: Paintbrush, name: "Painting", desc: "Interior, exterior, touch-ups", from: "$120", tone: "from-rose-500/20 to-rose-500/5" },
  { icon: Bug, name: "Pest Control", desc: "Inspection, treatment", from: "$89", tone: "from-violet-500/20 to-violet-500/5" },
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
            Six core trades, hundreds of vetted pros. Tap a category and we'll match you with someone who can be at your door today.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <a
              key={s.name}
              href="#"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant"
              style={{ animationDelay: `${i * 60}ms` }}
            >
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
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
