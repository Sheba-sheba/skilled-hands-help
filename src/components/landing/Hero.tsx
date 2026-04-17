import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Search, ShieldCheck, Star } from "lucide-react";
import heroImg from "@/assets/hero-tradesperson.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="absolute inset-0 bg-grain opacity-30" aria-hidden />
      <div className="absolute -right-32 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" aria-hidden />

      <div className="container relative grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:gap-16 lg:py-32">
        {/* Copy */}
        <div className="flex flex-col justify-center animate-fade-up">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Verified pros, on demand
          </div>

          <h1 className="font-display text-5xl leading-[0.95] text-balance sm:text-6xl lg:text-7xl xl:text-8xl">
            Local pros.
            <br />
            <span className="text-accent">Booked in</span>
            <br />
            60 seconds.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-primary-foreground/70 text-balance">
            From a leaky tap at midnight to a full rewire — find background-checked plumbers,
            electricians, handymen and cleaners near you. Real people, fair prices.
          </p>

          {/* Search bar */}
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3 px-3">
              <MapPin className="h-5 w-5 text-accent" />
              <input
                type="text"
                placeholder="Enter your address or zip"
                className="flex-1 bg-transparent py-2 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none"
              />
            </div>
            <Button variant="hero" size="lg" className="shrink-0">
              <Search className="h-4 w-4" /> Find pros
            </Button>
          </div>

          {/* Trust row */}
          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-primary-foreground/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              ID & licence verified
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-accent text-accent" />
              4.9 avg from 38,000+ jobs
            </div>
          </div>
        </div>

        {/* Visual */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-accent opacity-30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-elegant">
              <img
                src={heroImg}
                alt="Verified Toolbox electrician ready for a job"
                width={1080}
                height={1920}
                className="aspect-[3/4] w-full object-cover"
              />
              {/* Floating card */}
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-background/95 p-4 text-foreground shadow-elegant backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Arriving in</p>
                    <p className="font-display text-2xl">22 min</p>
                  </div>
                  <Button variant="accent" size="sm">
                    Track <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                  <div className="h-8 w-8 rounded-full bg-accent/20" />
                  <div className="text-sm">
                    <p className="font-semibold leading-tight">Sarah M.</p>
                    <p className="text-xs text-muted-foreground">Master electrician · 4.98 ★</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
