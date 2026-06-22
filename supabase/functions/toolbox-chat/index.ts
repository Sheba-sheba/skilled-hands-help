import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { convertToModelMessages, streamText, type UIMessage } from "npm:ai";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const SYSTEM = `You are the Toolbox Assistant — a friendly, knowledgeable chatbot for Toolbox, a marketplace that connects customers with vetted local trades pros (plumbers, electricians, handymen, cleaners).
Help potential clients understand how Toolbox works, what services are available, pricing expectations (hourly rates vary by pro and region), how booking works (pick a pro -> request date/time/address/job -> pro accepts or declines -> get notified), safety, payment, cancellations, and how to become a pro.
Be concise, warm, and practical. If a question is outside Toolbox, answer briefly and steer back. If you don't know, say so and suggest contacting support. Never invent specific prices or guarantee availability.`;

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
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(msg, { status: 500, headers: corsHeaders });
  }
});
