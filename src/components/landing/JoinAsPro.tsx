import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Calendar, Wallet } from "lucide-react";

const perks = [
  { icon: Wallet, label: "Keep 88%", desc: "Of every job, paid weekly" },
  { icon: Calendar, label: "Your hours", desc: "Accept what fits your day" },
  { icon: TrendingUp, label: "Build reputation", desc: "Reviews that travel with you" },
];

const JoinAsPro = () => {
  return (
    <section id="join" className="py-24 md:py-32">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-primary-foreground sm:px-14 md:px-20 md:py-24">
          <div className="absolute inset-0 bg-grain opacity-30" aria-hidden />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" aria-hidden />
          <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" aria-hidden />

          <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">For tradespeople</p>
              <h2 className="font-display text-4xl text-balance sm:text-5xl lg:text-6xl">
                Stop chasing leads. Start filling your calendar.
              </h2>
              <p className="mt-6 max-w-lg text-lg text-primary-foreground/70">
                Join 12,000+ pros earning more with Toolbox. No bidding wars. Real customers, transparent pricing, instant payouts.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="hero" size="xl">
                  Apply to join <ArrowRight />
                </Button>
                <Button variant="dark" size="xl">Learn more</Button>
              </div>
            </div>

            <div className="grid gap-4">
              {perks.map((p) => (
                <div
                  key={p.label}
                  className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-colors hover:bg-white/10"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <p.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-display text-2xl">{p.label}</p>
                    <p className="text-sm text-primary-foreground/60">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JoinAsPro;
