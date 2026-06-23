import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarIcon,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategory, type CategorySlug } from "@/lib/categories";
import { BOOKING_DRAFT_KEY, type BookingDraft } from "@/pages/AiToolbox";

interface ProviderDetail {
  id: string;
  category: CategorySlug;
  headline: string | null;
  hourly_rate: number | null;
  years_experience: number | null;
  service_area: string | null;
  rating: number;
  review_count: number;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    bio: string | null;
  } | null;
}

const bookingSchema = z.object({
  date: z.date({ required_error: "Pick a date" }),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a time"),
  address: z
    .string()
    .trim()
    .min(5, "Address is too short")
    .max(200, "Address is too long"),
  job_description: z
    .string()
    .trim()
    .min(10, "Tell us a bit more about the job")
    .max(1000, "Keep it under 1000 characters"),
});

const ProviderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // form
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("09:00");
  const [address, setAddress] = useState("");
  const [job, setJob] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftApplied, setDraftApplied] = useState(false);

  // Apply booking draft from chatbot if present
  useEffect(() => {
    if (!provider) return;
    try {
      const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as BookingDraft;
      if (draft.category !== provider.category) return;
      if (draft.job_description && !job) setJob(draft.job_description);
      if (draft.address && !address) setAddress(draft.address);
      if (draft.scheduled_time) setTime(draft.scheduled_time);
      if (draft.scheduled_date) {
        const d = new Date(`${draft.scheduled_date}T00:00:00`);
        if (!isNaN(d.getTime()) && d >= new Date(new Date().setHours(0, 0, 0, 0))) {
          setDate(d);
        }
      }
      setDraftApplied(true);
      sessionStorage.removeItem(BOOKING_DRAFT_KEY);
      toast.success("Draft from AI assistant applied");
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    (async () => {
      const { data: prov, error } = await supabase
        .from("public_providers")
        .select(
          "id, category, headline, hourly_rate, years_experience, service_area, rating, review_count, full_name, avatar_url, city, bio"
        )
        .eq("id", id)
        .maybeSingle();

      if (error || !prov) {
        setProvider(null);
        setLoading(false);
        return;
      }

      setProvider({
        id: prov.id as string,
        category: prov.category as CategorySlug,
        headline: prov.headline,
        hourly_rate: prov.hourly_rate,
        years_experience: prov.years_experience,
        service_area: prov.service_area,
        rating: prov.rating as number,
        review_count: prov.review_count as number,
        profile: {
          full_name: prov.full_name,
          avatar_url: prov.avatar_url,
          city: prov.city,
          bio: prov.bio,
        },
      });
      setLoading(false);
    })();
  }, [id]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to book a pro");
      navigate("/auth");
      return;
    }
    if (!provider) return;

    const parsed = bookingSchema.safeParse({
      date,
      time,
      address,
      job_description: job,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Check the form");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      customer_id: user.id,
      provider_id: provider.id,
      scheduled_date: format(parsed.data.date, "yyyy-MM-dd"),
      scheduled_time: parsed.data.time,
      address: parsed.data.address,
      job_description: parsed.data.job_description,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking request sent!");
    navigate("/bookings");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
        <Footer />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <h1 className="font-display text-4xl">Pro not found</h1>
          <Button variant="outline" className="mt-6" asChild>
            <Link to="/">Back home</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const cat = getCategory(provider.category);
  const name = provider.profile?.full_name ?? "Toolbox Pro";
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8 md:py-12">
        <Link
          to={cat ? `/providers/${cat.slug}` : "/"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {cat ? `Back to ${cat.plural.toLowerCase()}` : "Back"}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* LEFT: profile */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <ProfileAvatar
                  avatar={provider.profile?.avatar_url}
                  initials={initials}
                  className="h-20 w-20"
                  fallbackClassName="text-2xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-3xl">{name}</h1>
                    <Badge className="gap-1 bg-accent/15 text-accent hover:bg-accent/20">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {cat?.label ?? "Pro"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-semibold">
                        {Number(provider.rating).toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({provider.review_count} reviews)
                      </span>
                    </span>
                    {(provider.profile?.city ?? provider.service_area) && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {provider.profile?.city ?? provider.service_area}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    From
                  </p>
                  <p className="font-display text-3xl">
                    ${provider.hourly_rate ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">per hour</p>
                </div>
              </div>

              {(provider.headline || provider.profile?.bio) && (
                <div className="mt-6 border-t border-border pt-6">
                  <h2 className="font-display text-lg">About</h2>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                    {provider.headline ?? provider.profile?.bio}
                  </p>
                </div>
              )}

              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6 text-center">
                <Stat label="Experience" value={`${provider.years_experience ?? 1}+ yrs`} />
                <Stat label="Reviews" value={String(provider.review_count)} />
                <Stat label="Rating" value={Number(provider.rating).toFixed(1)} />
              </div>
            </div>
          </div>

          {/* RIGHT: booking form */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <form
              onSubmit={handleBook}
              className="rounded-3xl border border-border bg-card p-6 shadow-elegant"
            >
              <h2 className="font-display text-2xl">Book this pro</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us when and where — they'll confirm shortly.
              </p>
              {draftApplied && (
                <div className="mt-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-foreground">
                  ✨ Pre-filled from your AI assistant draft. Review and adjust before sending.
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) =>
                          d < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bk-time">Time</Label>
                  <Input
                    id="bk-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bk-address">Address</Label>
                  <Input
                    id="bk-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, Brooklyn"
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bk-job">Job description</Label>
                  <Textarea
                    id="bk-job"
                    value={job}
                    onChange={(e) => setJob(e.target.value)}
                    placeholder="Describe what needs doing — type, scale, urgency…"
                    rows={4}
                    maxLength={1000}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {job.length}/1000
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={submitting || authLoading}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : user ? (
                    "Request booking"
                  ) : (
                    "Sign in to book"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  No charge until the pro confirms.
                </p>
              </div>
            </form>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="font-display text-2xl">{value}</p>
    <p className="text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
  </div>
);

export default ProviderDetail;
