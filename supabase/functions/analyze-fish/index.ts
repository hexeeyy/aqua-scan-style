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
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sub || payload.role !== "authenticated") return null;
    return payload;
  } catch {
    return null;
  }
}
// Simple in-memory rate limiter: max 10 requests per user per 60 seconds
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
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
  
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] analyze-fish request received`);
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
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment before scanning again." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
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

    // Processing image analysis

    // Call Lovable AI with image analysis
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
            content: `You are an expert marine biologist and fish quality inspector specializing in Philippine seafood markets. Analyze images to:
1. First, determine if the image contains a fish (isActuallyFish: true/false)
2. If it's a fish, identify the species (common name and scientific name)
3. Assess freshness level (fresh/moderate/poor) based on:
   - Eye clarity (clear, cloudy, sunken)
   - Gill color (bright red/pink = fresh, brown/gray = old)
   - Skin texture and appearance (firm, shiny, slimy)
   - Overall condition
4. Estimate the current Philippine market price per kilogram in PESOS (PHP) based on:
   - Bureau of Fisheries and Aquatic Resources (BFAR) price bulletins
   - Department of Agriculture (DA) market monitoring data
   - Major fish markets (Navotas, Farmers Market, provincial wet markets)
   - Typical retail prices in the Philippines for 2024-2025
5. Provide additional data: habitat, nutritional info, and typical collection areas in the Philippines
6. Predict spoilage timeline based on freshness level:
   - Estimate hours remaining before the fish becomes unsafe at room temperature (~30°C in PH)
   - Provide storage recommendations with expected shelf life for each method (ice, refrigerator, freezer)
   - Consider the current freshness state when estimating remaining time
7. Estimate how long the fish has been sitting at the market/display based on visual cues:
   - Assess deterioration signs (skin dullness, eye cloudiness progression, gill discoloration rate)
   - Estimate hours since the fish was likely placed on display
   - Factor in typical Philippine wet market conditions (~30°C, high humidity)
8. Provide comprehensive consumer recommendations based on the estimated market duration:
   - Buy/Don't Buy verdict with reasoning
   - Fair price assessment (should price be lower given time on display?)
   - Handling and cooking tips appropriate for the freshness level
   - Safety warnings if applicable

Return ONLY a valid JSON object with this exact structure:
{
  "isActuallyFish": true,
  "species": {
    "name": "Common Name",
    "scientificName": "Scientific name",
    "confidence": 85
  },
  "freshness": {
    "level": "fresh",
    "score": 92,
    "reasoning": "Brief explanation"
  },
  "stats": {
    "eyeClarity": "Clear/Cloudy/Sunken",
    "gillColor": "Bright Red/Pink/Brown/Gray",
    "texture": "Firm/Soft/Slimy"
  },
  "pricePerKilo": {
    "min": 250,
    "max": 450,
    "currency": "PHP",
    "source": "BFAR/DA Market Data"
  },
  "habitat": "Brief habitat description",
  "nutritionalInfo": {
    "protein": 20,
    "omega3": "High/Medium/Low",
    "calories": 150
  },
  "commonAreas": ["Visayan Sea", "Manila Bay", "Mindanao waters"],
  "spoilagePrediction": {
    "hoursAtRoomTemp": 6,
    "storage": [
      { "method": "Ice/Crushed Ice", "shelfLife": "2-3 days", "tempRange": "0-2°C" },
      { "method": "Refrigerator", "shelfLife": "3-5 days", "tempRange": "0-4°C" },
      { "method": "Freezer", "shelfLife": "3-6 months", "tempRange": "-18°C or below" }
    ],
    "riskLevel": "low",
    "recommendation": "Brief actionable recommendation based on current freshness"
  },
  "marketDuration": {
    "estimatedHours": 4,
    "confidence": "medium",
    "visualCues": ["Slight skin dullness", "Eyes beginning to cloud"],
    "displayCondition": "Open-air wet market, ~30°C"
  },
  "consumerRecommendation": {
    "verdict": "buy",
    "verdictReason": "Fish is still fresh enough for safe consumption within the next few hours.",
    "priceFairness": {
      "isFair": true,
      "adjustedPriceMin": 200,
      "adjustedPriceMax": 350,
      "reason": "Price is fair given the freshness level."
    },
    "handlingTips": [
      "Cook within 4 hours or refrigerate immediately",
      "Best prepared as grilled or fried — avoid raw preparations"
    ],
    "cookingMethods": ["Grilled (inihaw)", "Fried (prito)", "Sinigang"],
    "safetyWarnings": []
  }
}

If the image is NOT a fish, return:
{
  "isActuallyFish": false,
  "message": "This is not a fish"
}

IMPORTANT: Use realistic Philippine peso prices based on current market rates. Common fish like tilapia: ₱120-180/kg, bangus: ₱160-220/kg, galunggong: ₱180-280/kg, tuna: ₱300-500/kg, lapu-lapu: ₱400-800/kg. Adjust for freshness.

CRITICAL FRESHNESS EVALUATION RULES — DO NOT DEFAULT TO MODERATE:
You MUST evaluate freshness independently for each image. Do NOT use "moderate" as a safe middle-ground default.

FRESHNESS LEVEL DECISION TREE (follow strictly):
★ "fresh" (score 75-100): Use when AT LEAST 2 of these are true:
  - Eyes are clear, bright, and convex (not flat or sunken)
  - Gills are bright red or vibrant pink
  - Skin is shiny, metallic, with intact scales and clear mucus
  - Flesh is firm when pressed (springs back)
  - No off-odor indicators visible (no yellowing, no dullness)
  → Most fish photographed at markets early morning or just caught SHOULD be "fresh"

★ "moderate" (score 40-74): Use ONLY when clear deterioration signs are visible:
  - Eyes are slightly cloudy or flattening but not sunken
  - Gills are fading from red toward brownish-pink  
  - Skin is losing sheen, some scale loss visible
  - Slight softening of flesh
  → This means the fish has been sitting for several hours and shows VISIBLE aging

★ "poor" (score 0-39): Use when obvious spoilage is present:
  - Eyes are sunken, gray, or opaque
  - Gills are brown, gray, or greenish
  - Skin is dull, slimy with milky/yellowish mucus
  - Flesh is soft, leaves indentation when pressed
  - Visible discoloration or bloating

IMPORTANT: A fish that looks reasonably good with clear eyes and decent color should be rated "fresh", NOT "moderate". Reserve "moderate" for fish showing multiple visible signs of aging. The freshness score should use the FULL range (0-100), not cluster around 50-70.

Spoilage prediction guidelines:
- Fresh fish at room temp (~30°C PH climate): 4-8 hours safe
- Moderate freshness at room temp: 1-3 hours safe
- Poor freshness: already unsafe, 0 hours
- riskLevel: "low" for fresh, "moderate" for moderate, "high" for poor

Market duration estimation guidelines:
- Fresh (clear eyes, bright gills, firm): 0-3 hours on display
- Moderate (slight cloudiness, fading gills): 3-8 hours on display
- Poor (sunken eyes, brown gills, soft): 8+ hours on display
- confidence: "high" if visual cues are very clear, "medium" for typical, "low" if uncertain

Consumer recommendation guidelines:
- verdict: "buy" (fresh, good value), "buy_with_caution" (moderate, cook soon), "dont_buy" (poor, unsafe)
- Adjust price fairness based on freshness — fish that's been sitting longer should cost less
- Include Filipino cooking method names where applicable (inihaw, sinigang, paksiw, etc.)
- Safety warnings only for moderate-to-poor freshness

Be accurate and professional. Confidence should reflect uncertainty (80-95% for clear fish, 60-79% for unclear images).`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this fish image and provide species identification and freshness assessment.",
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status);

      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Log raw content length for debugging
    console.log("AI response length:", content.length);
    const finishReason = data.choices?.[0]?.finish_reason;
    console.log("Finish reason:", finishReason);

    // Parse the JSON response
    let result;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Detect and attempt to fix truncation
      if (finishReason === "length") {
        console.warn("Response was truncated by token limit");
        // Try to close open braces/brackets
        const openBraces = (cleanContent.match(/{/g) || []).length;
        const closeBraces = (cleanContent.match(/}/g) || []).length;
        const openBrackets = (cleanContent.match(/\[/g) || []).length;
        const closeBrackets = (cleanContent.match(/\]/g) || []).length;

        // Remove trailing comma if present
        cleanContent = cleanContent.replace(/,\s*$/, "");

        for (let i = 0; i < openBrackets - closeBrackets; i++) cleanContent += "]";
        for (let i = 0; i < openBraces - closeBraces; i++) cleanContent += "}";
      }

      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response. Content preview:", content.substring(0, 200));
      throw new Error("Failed to parse AI response as JSON");
    }

    // Log which keys were returned
    console.log("Response keys:", Object.keys(result).join(", "));

    // Validate the response structure
    if (result.isActuallyFish === false) {
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (
      !result.species ||
      !result.freshness ||
      !result.stats ||
      !result.pricePerKilo ||
      !result.habitat ||
      !result.nutritionalInfo ||
      !result.commonAreas
    ) {
      console.error("Missing required fields. Got:", Object.keys(result).join(", "));
      throw new Error("Invalid response structure from AI");
    }

    // Ensure new fields have defaults if AI didn't return them (graceful degradation)
    if (!result.marketDuration) {
      console.warn("marketDuration not in AI response, adding defaults");
      result.marketDuration = {
        estimatedHours: result.freshness.level === "fresh" ? 2 : result.freshness.level === "moderate" ? 5 : 10,
        confidence: "low",
        visualCues: [result.stats.eyeClarity, result.stats.gillColor, result.stats.texture],
        displayCondition: "Open-air wet market, ~30°C, high humidity",
      };
    }

    if (!result.consumerRecommendation) {
      console.warn("consumerRecommendation not in AI response, adding defaults");
      const level = result.freshness.level;
      result.consumerRecommendation = {
        verdict: level === "fresh" ? "buy" : level === "moderate" ? "buy_with_caution" : "dont_buy",
        verdictReason:
          level === "fresh"
            ? "Fish appears fresh and safe for consumption."
            : level === "moderate"
              ? "Fish shows signs of aging. Cook thoroughly before eating."
              : "Fish shows significant deterioration. Not recommended for consumption.",
        priceFairness: {
          isFair: level === "fresh",
          adjustedPriceMin: result.pricePerKilo.min,
          adjustedPriceMax: result.pricePerKilo.max,
          reason:
            level === "fresh"
              ? "Price is fair for this freshness level."
              : "Price should be lower given the freshness level.",
        },
        handlingTips:
          level === "fresh"
            ? ["Store on ice immediately", "Cook within 24 hours for best quality"]
            : ["Refrigerate immediately", "Cook thoroughly before eating"],
        cookingMethods: level === "poor" ? ["Not recommended"] : ["Grilled (inihaw)", "Sinigang", "Fried (prito)"],
        safetyWarnings:
          level === "poor" ? ["Fish may be unsafe for consumption", "Check for off odors before handling"] : [],
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`[${requestId}] Analysis error:`, {
      type: (error as Error)?.name,
      msg: (error as Error)?.message,
      timestamp: new Date().toISOString(),
    });
    return new Response(JSON.stringify({ error: "An error occurred processing your request." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
