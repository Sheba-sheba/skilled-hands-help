import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CalendarIcon, Clock, Loader2, MapPin } from "lucide-react";
import { getCategory } from "@/lib/categories";

interface BookingRow {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  job_description: string;
  status: string;
  created_at: string;
  provider: {
    id: string;
    category: string;
    user_id: string;
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

const statusVariants: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 hover:bg-amber-500/20",
  accepted: "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20",
  declined: "bg-destructive/15 text-destructive hover:bg-destructive/20",
  completed: "bg-primary/15 text-primary hover:bg-primary/20",
  cancelled: "bg-muted text-muted-foreground",
};

const Bookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, scheduled_date, scheduled_time, address, job_description, status, created_at, provider:providers(id, category, user_id)"
        )
        .eq("customer_id", user.id)
        .order("scheduled_date", { ascending: false });

      if (error || !data) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const userIds = Array.from(
        new Set(data.map((b) => b.provider?.user_id).filter(Boolean) as string[])
      );
      const { data: profiles } = userIds.length
        ? await supabase
            .from("public_profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", userIds)
        : { data: [] as { user_id: string; full_name: string | null; avatar_url: string | null }[] };
      const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p]));

      setBookings(
        data.map((b) => ({
          ...b,
          provider: {
            ...b.provider!,
            profile: byUser.get(b.provider!.user_id) ?? null,
          },
        })) as BookingRow[]
      );
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-10 md:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Your jobs
            </p>
            <h1 className="font-display text-4xl text-balance sm:text-5xl">
              My bookings
            </h1>
          </div>
          <Button variant="outline" asChild className="hidden sm:inline-flex">
            <Link to="/#services">Book another</Link>
          </Button>
        </div>

        <div className="mt-10">
          {loading || authLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 py-20 text-center">
              <p className="font-display text-2xl">No bookings yet</p>
              <p className="mt-2 text-muted-foreground">
                Pick a service to find a pro near you.
              </p>
              <Button variant="hero" className="mt-6" asChild>
                <Link to="/#services">Browse services</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {bookings.map((b) => {
                const cat = getCategory(b.provider.category);
                const name = b.provider.profile?.full_name ?? "Toolbox Pro";
                const initials = name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <Link
                    key={b.id}
                    to={`/providers/detail/${b.provider.id}`}
                    className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-elegant md:flex-row md:items-center"
                  >
                    <Avatar className="h-14 w-14 shrink-0 border-2 border-border">
                      <AvatarImage src={b.provider.profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg">{name}</h3>
                        <Badge variant="secondary">{cat?.label ?? "Pro"}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {b.job_description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(parseISO(b.scheduled_date), "EEE, MMM d")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {b.scheduled_time.slice(0, 5)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {b.address}
                        </span>
                      </div>
                    </div>

                    <Badge
                      className={`${statusVariants[b.status] ?? "bg-secondary"} shrink-0 capitalize`}
                    >
                      {b.status}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Bookings;
