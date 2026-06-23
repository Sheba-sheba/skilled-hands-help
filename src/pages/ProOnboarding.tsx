import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

type DaySlot = { enabled: boolean; start: string; end: string };
type Availability = Record<DayKey, DaySlot>;

const DEFAULT_AVAILABILITY: Availability = {
  mon: { enabled: true, start: "09:00", end: "17:00" },
  tue: { enabled: true, start: "09:00", end: "17:00" },
  wed: { enabled: true, start: "09:00", end: "17:00" },
  thu: { enabled: true, start: "09:00", end: "17:00" },
  fri: { enabled: true, start: "09:00", end: "17:00" },
  sat: { enabled: false, start: "10:00", end: "14:00" },
  sun: { enabled: false, start: "10:00", end: "14:00" },
};

const STEPS = [
  { title: "Service", icon: Sparkles, desc: "Pick the category you offer" },
  { title: "Availability", icon: ClipboardList, desc: "Set your weekly hours" },
  { title: "Pricing", icon: ShieldCheck, desc: "Your hourly price range" },
  { title: "License", icon: FileText, desc: "Upload a verification document" },
];

const submitSchema = z.object({
  category: z.enum(["plumber", "electrician", "handyman", "cleaner"]),
  service_area: z.string().trim().min(2, "Where do you work?").max(120),
  headline: z
    .string()
    .trim()
    .min(10, "Tell customers what you do (10+ chars)")
    .max(180),
  years_experience: z.number().int().min(0).max(60),
  price_min: z.number().min(1, "Set a minimum rate").max(1000),
  price_max: z.number().min(1).max(2000),
  availability: z.record(z.object({ enabled: z.boolean(), start: z.string(), end: z.string() })),
});

const ProOnboarding = () => {
  const navigate = useNavigate();
  const { user, roles, loading: authLoading } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Provider state
  const [providerId, setProviderId] = useState<string | null>(null);
  const [alreadyPublished, setAlreadyPublished] = useState(false);

  // Form state
  const [category, setCategory] = useState<CategorySlug>("handyman");
  const [serviceArea, setServiceArea] = useState("");
  const [headline, setHeadline] = useState("");
  const [yearsExp, setYearsExp] = useState<number>(2);
  const [priceMin, setPriceMin] = useState<number>(40);
  const [priceMax, setPriceMax] = useState<number>(90);
  const [availability, setAvailability] = useState<Availability>(DEFAULT_AVAILABILITY);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [existingLicenseName, setExistingLicenseName] = useState<string | null>(null);

  // Gate: must be signed in + provider role
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!roles.includes("provider")) {
      toast.error("Pro onboarding is only for Pro accounts");
      navigate("/", { replace: true });
    }
  }, [user, roles, authLoading, navigate]);

  // Load existing provider row to prefill
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("providers")
        .select(
          "id, category, headline, service_area, years_experience, price_min, price_max, availability, license_doc_name, is_active"
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (!error && data) {
        setProviderId(data.id);
        setAlreadyPublished(!!data.is_active);
        setCategory(data.category as CategorySlug);
        setHeadline(data.headline ?? "");
        setServiceArea(data.service_area ?? "");
        setYearsExp(data.years_experience ?? 2);
        setPriceMin(data.price_min ? Number(data.price_min) : 40);
        setPriceMax(data.price_max ? Number(data.price_max) : 90);
        setExistingLicenseName(data.license_doc_name ?? null);
        if (data.availability && typeof data.availability === "object" && Object.keys(data.availability).length) {
          setAvailability({ ...DEFAULT_AVAILABILITY, ...(data.availability as Partial<Availability>) } as Availability);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  const canContinue = useMemo(() => {
    if (step === 0) return !!category && serviceArea.trim().length >= 2 && headline.trim().length >= 10;
    if (step === 1) return Object.values(availability).some((d) => d.enabled);
    if (step === 2) return priceMin >= 1 && priceMax >= priceMin;
    return true; // step 3 license optional
  }, [step, category, serviceArea, headline, availability, priceMin, priceMax]);

  const toggleDay = (k: DayKey, enabled: boolean) =>
    setAvailability((a) => ({ ...a, [k]: { ...a[k], enabled } }));
  const setDayTime = (k: DayKey, field: "start" | "end", value: string) =>
    setAvailability((a) => ({ ...a, [k]: { ...a[k], [field]: value } }));

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Document must be under 10MB");
      return;
    }
    setLicenseFile(f);
  };

  const handlePublish = async () => {
    if (!user || !providerId) return;
    const parsed = submitSchema.safeParse({
      category,
      service_area: serviceArea,
      headline,
      years_experience: yearsExp,
      price_min: priceMin,
      price_max: priceMax,
      availability,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please review your details");
      return;
    }
    if (priceMax < priceMin) {
      toast.error("Max price must be at least the minimum");
      return;
    }

    setSubmitting(true);

    let license_doc_path: string | null = null;
    let license_doc_name: string | null = existingLicenseName;

    if (licenseFile) {
      const ext = licenseFile.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `${user.id}/license-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("provider-docs")
        .upload(path, licenseFile, { upsert: true, contentType: licenseFile.type });
      if (upErr) {
        setSubmitting(false);
        toast.error(`Upload failed: ${upErr.message}`);
        return;
      }
      license_doc_path = path;
      license_doc_name = licenseFile.name;
    }

    const update: Record<string, unknown> = {
      category,
      headline: headline.trim(),
      service_area: serviceArea.trim(),
      years_experience: yearsExp,
      hourly_rate: priceMin, // legacy field — keep aligned with min price
      price_min: priceMin,
      price_max: priceMax,
      availability,
      is_active: true,
      onboarded_at: new Date().toISOString(),
    };
    if (license_doc_path) {
      update.license_doc_path = license_doc_path;
      update.license_doc_name = license_doc_name;
      // Re-enter verification queue on a fresh upload
      update.verification_status = "pending";
    }

    const { error } = await supabase
      .from("providers")
      .update(update)
      .eq("id", providerId)
      .eq("user_id", user.id);

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("You're published! Welcome to Toolbox.");
    navigate(`/providers/${category}`);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-3xl py-8 md:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-6 space-y-2">
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="h-3 w-3" /> Pro onboarding
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl">
            Get your listing live on Toolbox
          </h1>
          <p className="text-muted-foreground">
            A few details and we'll publish you to the {CATEGORIES.find((c) => c.slug === category)?.plural.toLowerCase()} directory.
            {alreadyPublished && " You're already live — edits will update your listing."}
          </p>
        </div>

        {/* Stepper */}
        <div className="mt-8 space-y-3">
          <Progress value={progress} className="h-2" />
          <div className="flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  i === step
                    ? "border-primary bg-primary text-primary-foreground"
                    : i < step
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                {i < step ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <s.icon className="h-3 w-3" />
                )}
                {s.title}
              </button>
            ))}
          </div>
        </div>

        <Card className="mt-6 border-border shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <StepIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-display text-xl">{STEPS[step].title}</CardTitle>
                <CardDescription>{STEPS[step].desc}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Service category</Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {CATEGORIES.map((c) => {
                      const selected = category === c.slug;
                      return (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={() => setCategory(c.slug)}
                          className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/5 shadow-soft"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <c.icon className="h-5 w-5 text-accent" />
                          <span className="font-semibold">{c.label}</span>
                          <span className="text-xs text-muted-foreground">{c.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="serviceArea">Service area</Label>
                    <Input
                      id="serviceArea"
                      placeholder="e.g. Austin, TX"
                      value={serviceArea}
                      maxLength={120}
                      onChange={(e) => setServiceArea(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="years">Years of experience</Label>
                    <Input
                      id="years"
                      type="number"
                      min={0}
                      max={60}
                      value={yearsExp}
                      onChange={(e) => setYearsExp(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headline">Headline</Label>
                  <Textarea
                    id="headline"
                    placeholder="One sentence customers see first — e.g. Licensed plumber, 10+ yrs, fast emergency response."
                    value={headline}
                    maxLength={180}
                    rows={3}
                    onChange={(e) => setHeadline(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{headline.length}/180</p>
                </div>
              </>
            )}

            {step === 1 && (
              <div className="space-y-3">
                {DAYS.map((d) => {
                  const slot = availability[d.key];
                  return (
                    <div
                      key={d.key}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <div className="flex w-24 items-center gap-3">
                        <Switch
                          checked={slot.enabled}
                          onCheckedChange={(v) => toggleDay(d.key, v)}
                          id={`day-${d.key}`}
                        />
                        <Label htmlFor={`day-${d.key}`} className="font-display text-base">
                          {d.label}
                        </Label>
                      </div>
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          type="time"
                          disabled={!slot.enabled}
                          value={slot.start}
                          onChange={(e) => setDayTime(d.key, "start", e.target.value)}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          disabled={!slot.enabled}
                          value={slot.end}
                          onChange={(e) => setDayTime(d.key, "end", e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  Customers see your weekly hours on your profile. You can edit this anytime.
                </p>
              </div>
            )}

            {step === 2 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="priceMin">Minimum hourly rate ($)</Label>
                    <Input
                      id="priceMin"
                      type="number"
                      min={1}
                      max={1000}
                      value={priceMin}
                      onChange={(e) => setPriceMin(Math.max(1, Math.min(1000, Number(e.target.value) || 0)))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceMax">Maximum hourly rate ($)</Label>
                    <Input
                      id="priceMax"
                      type="number"
                      min={1}
                      max={2000}
                      value={priceMax}
                      onChange={(e) => setPriceMax(Math.max(1, Math.min(2000, Number(e.target.value) || 0)))}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-sm">
                  Your listed range will be{" "}
                  <span className="font-semibold text-foreground">
                    ${priceMin} – ${priceMax}/hr
                  </span>
                  . Final quotes can vary by job complexity.
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <label
                  htmlFor="license"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 p-8 text-center transition-colors hover:border-primary"
                >
                  <Upload className="h-7 w-7 text-muted-foreground" />
                  <span className="font-semibold">
                    {licenseFile
                      ? licenseFile.name
                      : existingLicenseName
                        ? `Replace: ${existingLicenseName}`
                        : "Upload license or certification"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, PNG, or JPG · max 10MB · only Toolbox admins can view
                  </span>
                  <input
                    id="license"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    className="hidden"
                    onChange={handleLicenseChange}
                  />
                </label>

                <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  <Checkbox id="terms" defaultChecked className="mt-0.5" />
                  <label htmlFor="terms" className="cursor-pointer">
                    I confirm the information above is accurate and I'm authorised to perform this work in my area.
                  </label>
                </div>

                <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-accent">
                    <CheckCircle2 className="h-4 w-4" /> Ready to publish
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Hitting Publish makes you visible in the {CATEGORIES.find((c) => c.slug === category)?.plural} directory
                    immediately. Verification of your document happens within 1–2 business days.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              variant="hero"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue}
            >
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="hero" onClick={handlePublish} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Publishing…
                </>
              ) : (
                <>
                  Publish my listing <ShieldCheck className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProOnboarding;
