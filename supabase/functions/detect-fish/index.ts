import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    // Check required fields
    if (!payload.sub || payload.role !== "authenticated") return null;
    return payload;
  } catch {
    return null;
  }
}
// Simple in-memory rate limiter: max 20 requests per user per 60 seconds
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] detect-fish request received`);
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const jwtPayload = decodeJwtPayload(token);
    if (!jwtPayload) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit check
    const userId = jwtPayload.sub as string;
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({
          fishDetected: false,
          confidence: 0,
          quality: "unclear",
          message: "Too many requests. Please slow down.",
          species: null,
          scientificName: null,
          freshness: "unknown",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } },
      );
    }

    const { image } = await req.json();

    // Input validation
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "Invalid image data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataUrlPattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
    if (!dataUrlPattern.test(image)) {
      return new Response(JSON.stringify({ error: "Invalid image format. Only JPEG, PNG, and WebP are supported." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base64Data = image.split(",")[1];
    const imageSizeBytes = (base64Data.length * 3) / 4;
    if (imageSizeBytes > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Image too large. Maximum size is 5MB." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a real-time fish detection and species identification system optimized for REAL-WORLD camera captures from phones and tablets. These images are often imperfect. Return ONLY a JSON object:
{
  "fishDetected": true/false,
  "confidence": 0-100,
  "quality": "good/poor/unclear",
  "message": "Brief feedback",
  "species": "Common name of the fish species or null if not detected",
  "scientificName": "Scientific name or null",
  "freshness": "fresh/moderate/poor/unknown"
}

CRITICAL REAL-WORLD HANDLING RULES:
- Images may have poor/uneven lighting, glare, reflections from wet fish surfaces, or yellowish indoor market lighting. Compensate mentally for color casts.
- Fish may be on ice, in plastic bags, on cutting boards, held by hands, or surrounded by other fish. Focus on the PRIMARY/center fish.
- Images may be slightly blurry, low-resolution, or have motion blur. Still attempt identification if fish shape/features are discernible.
- Wet, slimy fish surfaces cause specular highlights — do NOT mistake these for signs of spoilage.
- Market fish are often piled together — identify the most prominent/centered specimen.

Species ID Rules:
- fishDetected: true if ANY fish or fish part is visible, even partially
- confidence: 80+ only when species features are clearly distinguishable despite image quality. 50-79 for reasonable guess. 30-49 for low certainty but fish is present.
- species: Identify the fish species. Common Philippine market fish: Tilapia, Milkfish (Bangus), Galunggong (Round Scad), Tulingan (Mackerel Tuna), Bangus, Dalagang Bukid (Yellowtail Fusilier), Alumahan (Indian Mackerel), Hasa-hasa (Short Mackerel), Lapu-lapu (Grouper), Maya-maya (Red Snapper), Catfish, Mudfish/Snakehead. Use common English name.
- scientificName: Latin name if identifiable. null otherwise.
- freshness: Visual assessment. Account for lighting conditions. "unknown" if image quality prevents assessment.
- quality: "good" even if imperfect lighting, as long as fish is identifiable. "poor" only if truly unusable.
- message: Include species name if detected, e.g. "Tilapia detected! Hold steady"`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Detect and identify the fish in this image.",
              },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] AI API error:`, response.status);

      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({
            fishDetected: false,
            confidence: 0,
            quality: "unclear",
            message: "Detection service temporarily unavailable",
            species: null,
            scientificName: null,
            freshness: "unknown",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content in AI response");

    const cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const result = JSON.parse(cleanContent);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`[${requestId}] Detection error:`, {
      type: (error as Error)?.name,
      timestamp: new Date().toISOString(),
    });
    return new Response(
      JSON.stringify({
        fishDetected: false,
        confidence: 0,
        quality: "unclear",
        message: "Detection error",
        species: null,
        scientificName: null,
        freshness: "unknown",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
