import { Star, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const pros = [
  { name: "Marcus T.", trade: "Master Plumber", rating: 4.97, jobs: 412, area: "Brooklyn", rate: 65, color: "bg-blue-500/15" },
  { name: "Sarah M.", trade: "Electrician", rating: 4.99, jobs: 287, area: "Queens", rate: 78, color: "bg-accent/20" },
  { name: "Diego R.", trade: "Handyman", rating: 4.92, jobs: 631, area: "Bronx", rate: 45, color: "bg-emerald-500/15" },
  { name: "Aisha K.", trade: "Painter", rating: 4.95, jobs: 198, area: "Manhattan", rate: 55, color: "bg-rose-500/15" },
];

const FeaturedPros = () => {
  return (
    <section id="pros" className="py-24 md:py-32">
      <div className="container">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">Top rated</p>
            <h2 className="font-display text-4xl text-balance sm:text-5xl lg:text-6xl">
              Meet your neighborhood pros.
            </h2>
          </div>
          <Button variant="outline" size="lg">Browse all pros</Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pros.map((p) => (
            <div
              key={p.name}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className={`relative aspect-[5/4] ${p.color}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-7xl text-foreground/15">{p.name.charAt(0)}</span>
                </div>
                <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-xs font-semibold shadow-soft">
                  <ShieldCheck className="h-3 w-3 text-success" />
                  Verified
                </div>
                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {p.rating}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-xl">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.trade}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {p.area} · {p.jobs} jobs
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <span className="font-display text-2xl">${p.rate}</span>
                    <span className="text-xs text-muted-foreground">/hr</span>
                  </div>
                  <Button variant="default" size="sm">Book</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPros;
