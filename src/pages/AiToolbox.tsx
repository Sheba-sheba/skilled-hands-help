import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mail, CalendarClock, MessageCircle, Sparkles, Send, Loader2, Copy, Check, ClipboardCheck, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { getCategory, type CategorySlug } from "@/lib/categories";

export interface BookingDraft {
  category: CategorySlug;
  job_description: string;
  address?: string;
  scheduled_date?: string;
  scheduled_time?: string;
}
export const BOOKING_DRAFT_KEY = "toolbox:booking_draft";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const AUTH_HEADERS = {
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button variant="ghost" size="sm" onClick={() => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

/* ---------- Email Generator ---------- */
function EmailTool() {
  const [audience, setAudience] = useState("client");
  const [tone, setTone] = useState("formal");
  const [perspective, setPerspective] = useState("pro");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return toast.error("Describe what the email is about");
    setLoading(true);
    setResult("");
    try {
      const prompt = `Perspective: ${perspective === "pro" ? "Service professional writing to a customer" : "Customer writing to a service professional"}
Audience: ${audience}
Tone: ${tone}
Purpose / context: ${topic}`;
      const { data, error } = await supabase.functions.invoke("toolbox-ai", {
        body: { mode: "email", prompt },
      });
      if (error) throw error;
      setResult(data.text);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
          <CardDescription>Generate a context-aware professional email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>I am a…</Label>
              <Select value={perspective} onValueChange={setPerspective}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">Pro (service provider)</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client / customer</SelectItem>
                  <SelectItem value="pro">Service provider</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="informal">Informal / friendly</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
                <SelectItem value="apologetic">Apologetic</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>What's the email about?</Label>
            <Textarea
              rows={6}
              placeholder="e.g. Confirm Tuesday 9am electrical inspection at 12 Oak St, mention $85/hr rate, and ask client to clear access to the breaker panel."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate email
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Draft</CardTitle>
            <CardDescription>Review, edit, and copy.</CardDescription>
          </div>
          {result && <CopyButton text={result} />}
        </CardHeader>
        <CardContent>
          {result ? (
            <Textarea
              className="min-h-[380px] font-mono text-sm"
              value={result}
              onChange={(e) => setResult(e.target.value)}
            />
          ) : (
            <div className="flex h-[380px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Your generated email will appear here.
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            AI-generated. Review for accuracy before sending.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Task Planner ---------- */
function PlannerTool() {
  const [timeframe, setTimeframe] = useState("day");
  const [startTime, setStartTime] = useState("08:00");
  const [jobs, setJobs] = useState("");
  const [constraints, setConstraints] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!jobs.trim()) return toast.error("List the jobs or tasks to plan");
    setLoading(true);
    setResult("");
    try {
      const prompt = `Timeframe: ${timeframe === "day" ? "Single day" : "Full work week"}
Working day starts at: ${startTime}
Jobs / tasks to schedule:
${jobs}

Constraints, preferences, or context:
${constraints || "(none specified)"}`;
      const { data, error } = await supabase.functions.invoke("toolbox-ai", {
        body: { mode: "planner", prompt },
      });
      if (error) throw error;
      setResult(data.text);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Plan your work</CardTitle>
          <CardDescription>For service pros: prioritise jobs, optimise travel and time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily plan</SelectItem>
                  <SelectItem value="week">Weekly plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Day starts at</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Jobs / tasks</Label>
            <Textarea
              rows={6}
              placeholder={"e.g.\n- Replace water heater @ 12 Oak St (3h, urgent)\n- Quote bathroom remodel, Maple Ave (1h)\n- Pick up parts at supplier\n- Follow-up call with Mrs. Singh"}
              value={jobs}
              onChange={(e) => setJobs(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Constraints (optional)</Label>
            <Textarea
              rows={3}
              placeholder="e.g. Must finish by 4pm for school pickup. Avoid downtown 3–5pm traffic."
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
            />
          </div>
          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate plan
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your schedule</CardTitle>
            <CardDescription>Optimised order with time blocks.</CardDescription>
          </div>
          {result && <CopyButton text={result} />}
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex h-[380px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Your plan will appear here.
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            AI-generated suggestion. Verify scheduling and travel times.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Chatbot ---------- */
function ChatTool() {
  const transport = useRef(
    new DefaultChatTransport({
      api: `${FN_URL}/toolbox-chat`,
      headers: AUTH_HEADERS,
    }),
  ).current;

  const { messages, sendMessage, status } = useChat({
    transport,
    onError: (e) => toast.error(e.message ?? "Chat error"),
  });

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
  };

  const navigate = useNavigate();

  const useDraft = (draft: BookingDraft) => {
    try {
      sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
    toast.success("Draft saved — pick a pro");
    navigate(`/providers/${draft.category}`);
  };

  const suggestions = [
    "My kitchen sink is leaking under the cabinet",
    "Need an electrician to install a ceiling fan",
    "Looking for a deep clean before move-out",
    "How does booking work?",
  ];

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-accent" /> Toolbox Assistant</CardTitle>
        <CardDescription>Ask a question — or describe a job and I'll prep a booking draft.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <Button key={s} variant="outline" size="sm"
                    onClick={() => sendMessage({ text: s })}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            const isUser = m.role === "user";

            // Extract any booking-draft tool results in this message
            const drafts: BookingDraft[] = m.parts
              .filter((p: any) =>
                p.type === "tool-create_booking_draft" &&
                p.state === "output-available" &&
                p.output?.draft
              )
              .map((p: any) => p.output.draft as BookingDraft);

            return (
              <div key={m.id} className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
                {(text || !drafts.length) && (
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}>
                    {isUser ? text : (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1">
                        <ReactMarkdown>{text || "…"}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
                {drafts.map((d, i) => {
                  const cat = getCategory(d.category);
                  return (
                    <div key={i} className="w-full max-w-[85%] rounded-2xl border border-accent/30 bg-accent/5 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                        <ClipboardCheck className="h-3.5 w-3.5" /> Booking draft
                      </div>
                      <p className="mt-2 font-display text-base">
                        {cat?.label ?? d.category}
                      </p>
                      <p className="mt-1 text-sm text-foreground">{d.job_description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                        {d.scheduled_date && <span className="rounded bg-background px-2 py-0.5">📅 {d.scheduled_date}</span>}
                        {d.scheduled_time && <span className="rounded bg-background px-2 py-0.5">🕐 {d.scheduled_time}</span>}
                        {d.address && <span className="rounded bg-background px-2 py-0.5">📍 {d.address}</span>}
                      </div>
                      <Button size="sm" className="mt-3 w-full" onClick={() => useDraft(d)}>
                        Pick a {cat?.label.toLowerCase() ?? "pro"} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">Thinking…</div>
            </div>
          )}
        </div>
        <form onSubmit={submit} className="flex gap-2 border-t pt-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          AI assistant. Responses may be inaccurate — verify important details with support.
        </p>
      </CardContent>
    </Card>
  );
}

/* ---------- Page ---------- */
export default function AiToolbox() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <div className="mb-8 max-w-2xl">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-accent">
            <Sparkles className="h-4 w-4" /> AI Toolbox
          </div>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">Productivity tools, powered by AI</h1>
          <p className="mt-2 text-muted-foreground">
            Three assistants built for the Toolbox community — for pros and customers alike.
          </p>
        </div>
        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4" />Email</TabsTrigger>
            <TabsTrigger value="planner"><CalendarClock className="mr-2 h-4 w-4" />Planner</TabsTrigger>
            <TabsTrigger value="chat"><MessageCircle className="mr-2 h-4 w-4" />Chat</TabsTrigger>
          </TabsList>
          <TabsContent value="email"><EmailTool /></TabsContent>
          <TabsContent value="planner"><PlannerTool /></TabsContent>
          <TabsContent value="chat"><ChatTool /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
