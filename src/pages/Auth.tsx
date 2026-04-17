import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, Wrench, HardHat, User } from "lucide-react";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";

type Role = "customer" | "provider";

const Auth = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  // Sign-in state
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siLoading, setSiLoading] = useState(false);

  // Sign-up state
  const [role, setRole] = useState<Role>("customer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState<CategorySlug>("handyman");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [suLoading, setSuLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be under 2MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSiLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: siEmail.trim(),
      password: siPassword,
    });
    setSiLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setSuLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          city: city.trim() || null,
          bio: bio.trim() || null,
          role,
        },
      },
    });

    if (error) {
      setSuLoading(false);
      toast.error(error.message);
      return;
    }

    // Upload avatar if provided (after signup so we have user.id)
    const newUser = data.user;
    if (newUser && avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${newUser.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });

      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("user_id", newUser.id);
      }
    }

    setSuLoading(false);
    toast.success(`Welcome to Toolbox, ${fullName.split(" ")[0]}!`);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Top bar */}
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="font-display text-xl tracking-tight">Toolbox</span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <div className="container grid gap-12 py-10 lg:grid-cols-2 lg:gap-20 lg:py-16">
        {/* Left: copy */}
        <div className="hidden flex-col justify-center lg:flex">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">Welcome</p>
          <h1 className="font-display text-5xl text-balance lg:text-6xl">
            Your toolbox,
            <br />
            <span className="text-accent">unlocked.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Book vetted local pros in 60 seconds, or join thousands of tradespeople earning more — all in one app.
          </p>
          <div className="mt-10 grid gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent"><User className="h-5 w-5" /></div>
              <div>
                <p className="font-display text-base">As a customer</p>
                <p className="text-xs text-muted-foreground">Book, track and pay in app.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><HardHat className="h-5 w-5" /></div>
              <div>
                <p className="font-display text-base">As a pro</p>
                <p className="text-xs text-muted-foreground">Real jobs, fair prices, weekly payouts.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: form card */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant sm:p-8">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              {/* SIGN IN */}
              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="si-email">Email</Label>
                    <Input
                      id="si-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={siEmail}
                      onChange={(e) => setSiEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="si-password">Password</Label>
                    <Input
                      id="si-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={siPassword}
                      onChange={(e) => setSiPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={siLoading}>
                    {siLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              {/* SIGN UP */}
              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-5">
                  {/* Role toggle */}
                  <div>
                    <Label className="mb-2 block">I'm signing up as</Label>
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-secondary/40 p-1">
                      <button
                        type="button"
                        onClick={() => setRole("customer")}
                        className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                          role === "customer"
                            ? "bg-card text-foreground shadow-soft"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <User className="h-4 w-4" /> Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("provider")}
                        className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                          role === "provider"
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <HardHat className="h-4 w-4" /> Pro
                      </button>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-accent"
                      aria-label="Upload avatar"
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground group-hover:text-accent" />
                      )}
                    </button>
                    <div className="text-sm">
                      <p className="font-semibold">Add a photo</p>
                      <p className="text-xs text-muted-foreground">Optional · max 2MB</p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="su-name">Full name</Label>
                    <Input id="su-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Sarah Mendez" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="su-phone">Phone</Label>
                      <Input id="su-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="555 0123" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="su-city">City</Label>
                      <Input id="su-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Brooklyn" />
                    </div>
                  </div>

                  {role === "provider" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="su-bio">Short bio</Label>
                      <Textarea
                        id="su-bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Master electrician, 12 years experience…"
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-password">Password</Label>
                    <Input id="su-password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={suLoading}>
                    {suLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : `Create ${role === "provider" ? "pro" : "customer"} account`}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    By signing up you agree to our Terms and Privacy Policy.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
