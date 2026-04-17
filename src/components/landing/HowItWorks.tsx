import { Search, CalendarCheck, Sparkles } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Search,
    title: "Tell us what's broken",
    desc: "Pick a service, drop a pin, snap a photo if you want. Takes 30 seconds.",
  },
  {
    n: "02",
    icon: CalendarCheck,
    title: "Match with a verified pro",
    desc: "We surface nearby pros with live availability, ratings and upfront pricing.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Job done. Pay in app.",
    desc: "Track arrival, chat, pay securely. Rate your pro and re-book in one tap.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how" className="relative overflow-hidden bg-secondary py-24 md:py-32">
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div className="container relative">
        <div className="mb-16 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">How it works</p>
          <h2 className="font-display text-4xl text-balance sm:text-5xl lg:text-6xl">
            From broken to fixed in three taps.
          </h2>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* connecting line */}
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent md:block" aria-hidden />

          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-card-soft">
                <s.icon className="h-8 w-8 text-accent" />
              </div>
              <p className="mt-6 font-display text-6xl text-accent/20">{s.n}</p>
              <h3 className="mt-2 font-display text-2xl">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
