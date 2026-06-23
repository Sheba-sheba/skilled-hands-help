import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ArrowLeft, Loader2, MapPin, Star } from "lucide-react";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { BOOKING_DRAFT_KEY, type BookingDraft } from "@/pages/AiToolbox";
import { Sparkles } from "lucide-react";

interface ProviderRow {
  id: string;
  category: string;
  headline: string | null;
  hourly_rate: number | null;
  years_experience: number | null;
  service_area: string | null;
  rating: number;
  review_count: number;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
  } | null;
}

type SortKey = "rating" | "price_asc" | "price_desc";

const Providers = () => {
  const { category } = useParams<{ category: string }>();
  const cat = category ? getCategory(category) : undefined;

  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState<string>("0");
  const [sort, setSort] = useState<SortKey>("rating");

  const [pendingDraft, setPendingDraft] = useState<BookingDraft | null>(null);

  useEffect(() => {
    if (!cat) return;
    try {
      const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
      if (!raw) return setPendingDraft(null);
      const d = JSON.parse(raw) as BookingDraft;
      setPendingDraft(d.category === cat.slug ? d : null);
    } catch {
      setPendingDraft(null);
    }
  }, [cat]);

  useEffect(() => {
    if (!cat) return;
    setLoading(true);

    (async () => {
      const { data: provs, error } = await supabase
        .from("public_providers")
        .select(
          "id, category, headline, hourly_rate, years_experience, service_area, rating, review_count, full_name, avatar_url, city"
        )
        .eq("category", cat.slug);

      if (error || !provs) {
        setProviders([]);
        setLoading(false);
        return;
      }

      setProviders(
        provs.map((p) => ({
          id: p.id as string,
          category: p.category as string,
          headline: p.headline,
          hourly_rate: p.hourly_rate,
          years_experience: p.years_experience,
          service_area: p.service_area,
          rating: p.rating as number,
          review_count: p.review_count as number,
          profile: {
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            city: p.city,
          },
        }))
      );
      setLoading(false);
    })();
  }, [cat]);

  const filtered = useMemo(() => {
    const cityQ = city.trim().toLowerCase();
    const min = parseFloat(minRating);
    let rows = providers.filter((p) => {
      if (cityQ) {
        const c = (p.profile?.city ?? p.service_area ?? "").toLowerCase();
        if (!c.includes(cityQ)) return false;
      }
      if (p.rating < min) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      const ar = a.hourly_rate ?? Infinity;
      const br = b.hourly_rate ?? Infinity;
      return sort === "price_asc" ? ar - br : br - ar;
    });
    return rows;
  }, [providers, city, minRating, sort]);

  if (!cat) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <h1 className="font-display text-4xl">Unknown category</h1>
          <p className="mt-2 text-muted-foreground">
            Pick one from the list below.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {CATEGORIES.map((c) => (
              <Button key={c.slug} variant="outline" asChild>
                <Link to={`/providers/${c.slug}`}>
                  <c.icon /> {c.plural}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const Icon = cat.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className={`relative overflow-hidden border-b border-border bg-gradient-to-br ${cat.tone}`}>
        <div className="container py-12 md:py-16">
          <Link
            to="/#services"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All services
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                Browse pros
              </p>
              <h1 className="font-display text-4xl text-balance sm:text-5xl">
                {cat.plural} near you
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-muted-foreground">
            {cat.description}. All vetted, background-checked, and reviewed by
            real customers.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-card/50">
        <div className="container flex flex-col gap-3 py-5 md:flex-row md:items-center">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Filter by city or zip"
              className="pl-9"
              maxLength={80}
            />
          </div>
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue placeholder="Min rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any rating</SelectItem>
              <SelectItem value="4">4★ &amp; up</SelectItem>
              <SelectItem value="4.5">4.5★ &amp; up</SelectItem>
              <SelectItem value="4.8">4.8★ &amp; up</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Top rated</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Results */}
      <section className="container py-10 md:py-14">
        {pendingDraft && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Booking draft ready</p>
              <p className="mt-0.5 text-muted-foreground line-clamp-2">
                "{pendingDraft.job_description}"
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pick a {cat.label.toLowerCase()} below — your details will pre-fill the booking form.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem(BOOKING_DRAFT_KEY);
                setPendingDraft(null);
              }}
            >
              Dismiss
            </Button>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading pros…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 py-20 text-center">
            <p className="font-display text-2xl">No pros match your filters</p>
            <p className="mt-2 text-muted-foreground">
              {providers.length === 0
                ? `Be the first ${cat.label.toLowerCase()} on Toolbox.`
                : "Try widening your search."}
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link to="/auth">Join as a Pro</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const name = p.profile?.full_name ?? "Toolbox Pro";
              const initials = name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <Link
                  key={p.id}
                  to={`/providers/detail/${p.id}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-elegant"
                >
                  <div className="flex items-start gap-4">
                    <ProfileAvatar
                      avatar={p.profile?.avatar_url}
                      initials={initials}
                      className="h-14 w-14"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-xl">{name}</h3>
                      <div className="mt-1 flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="font-semibold">{Number(p.rating).toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({p.review_count})
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                    {p.headline ?? `Experienced ${cat.label.toLowerCase()} ready to help.`}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {(p.profile?.city ?? p.service_area) && (
                      <Badge variant="secondary" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {p.profile?.city ?? p.service_area}
                      </Badge>
                    )}
                    {p.years_experience != null && (
                      <Badge variant="secondary">
                        {p.years_experience}+ yrs
                      </Badge>
                    )}
                  </div>
                  <div className="mt-5 flex items-baseline justify-between border-t border-dashed border-border pt-4">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        from
                      </span>
                      <span className="ml-1.5 font-display text-xl">
                        ${p.hourly_rate ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">/hr</span>
                    </div>
                    <span className="text-sm font-semibold text-accent transition-transform group-hover:translate-x-0.5">
                      Book →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Providers;
