import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
  type UIMessage,
} from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const SYSTEM = `You are the Toolbox Assistant — a friendly, knowledgeable chatbot for Toolbox, a marketplace that connects customers with vetted local trades pros (plumbers, electricians, handymen, cleaners).

You help potential clients in two ways:
1) Answer questions about Toolbox — how booking works, pricing expectations, becoming a pro, safety, payments, cancellations.
2) When a user describes a JOB they need done ("my sink is leaking", "need someone to fix wiring", "deep clean my apartment"), help them convert it into a booking request.

Booking-draft workflow:
- Identify which of the 4 categories fits: plumber, electrician, handyman, cleaner.
- Naturally gather: a short job description, ideally the address/city, and a preferred date/time if they mention one. DO NOT block on missing fields — date/time/address are optional in the draft.
- Once you have at least a category and a 1-sentence job description, CALL the \`create_booking_draft\` tool with what you have. Do not ask 5 questions first — one short clarifying question max if the category is genuinely unclear.
- After the tool runs, write one short sentence telling the user you've prepared a draft and they can pick a pro from the card below. Do not repeat the draft contents in prose.

Be concise, warm, and practical. Never invent specific prices or guarantee availability. Today's date: ${new Date().toISOString().slice(0, 10)}.`;

const draftTool = tool({
  description:
    "Create a pre-filled booking draft for a service category. Call this when the user describes a job they want done.",
  inputSchema: z.object({
    category: z
      .enum(["plumber", "electrician", "handyman", "cleaner"])
      .describe("Which Toolbox category fits the job."),
    job_description: z
      .string()
      .min(10)
      .max(1000)
      .describe("Clear 1–3 sentence description of the job, in the customer's voice."),
    address: z
      .string()
      .max(200)
      .optional()
      .describe("Street address or city if the user mentioned one."),
    scheduled_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("YYYY-MM-DD if the user mentioned a date. Must be today or later."),
    scheduled_time: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional()
      .describe("HH:MM 24h if the user mentioned a time."),
  }),
  execute: async (input) => ({ ok: true, draft: input }),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response("Missing LOVABLE_API_KEY", { status: 500, headers: corsHeaders });
    }

    const { messages } = (await req.json()) as { messages: UIMessage[] };
    if (!Array.isArray(messages)) {
      return new Response("messages required", { status: 400, headers: corsHeaders });
    }

    const gateway = createLovableAiGatewayProvider(apiKey);
    const result = streamText({
      model: gateway("google/gemini-3-flash-preview"),
      system: SYSTEM,
      messages: await convertToModelMessages(messages),
      tools: { create_booking_draft: draftTool },
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(msg, { status: 500, headers: corsHeaders });
  }
});
