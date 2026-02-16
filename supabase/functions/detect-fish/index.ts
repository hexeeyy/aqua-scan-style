import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabaseClient.auth.getClaims(token);
    if (authError || !authData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { image } = await req.json();

    // Input validation
    if (!image || typeof image !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid image data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dataUrlPattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
    if (!dataUrlPattern.test(image)) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Only JPEG, PNG, and WebP are supported.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const base64Data = image.split(',')[1];
    const imageSizeBytes = (base64Data.length * 3) / 4;
    if (imageSizeBytes > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Maximum size is 5MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a real-time fish detection and species identification system. Analyze the image and return ONLY a JSON object:
{
  "fishDetected": true/false,
  "confidence": 0-100,
  "quality": "good/poor/unclear",
  "message": "Brief feedback",
  "species": "Common name of the fish species or null if not detected",
  "scientificName": "Scientific name or null",
  "freshness": "fresh/moderate/poor/unknown"
}

Rules:
- fishDetected: true if a fish is clearly visible
- confidence: 80+ for high certainty species ID, 50-79 for uncertain
- quality: "good" if well-lit and centered
- species: Identify the fish species if possible (e.g. "Tilapia", "Milkfish", "Galunggong"). null if no fish.
- scientificName: Latin name if identifiable. null otherwise.
- freshness: Quick visual assessment based on eye clarity, skin color, gill appearance. "unknown" if can't determine.
- message: Include species name if detected, e.g. "Tilapia detected! Hold steady"`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Detect and identify the fish in this image.'
              },
              {
                type: 'image_url',
                image_url: { url: image }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status);
      
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ 
            fishDetected: false, confidence: 0, quality: "unclear",
            message: "Detection service temporarily unavailable",
            species: null, scientificName: null, freshness: "unknown"
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI service error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error('No content in AI response');

    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanContent);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Detection error:', { type: (error as Error)?.name, timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ 
        fishDetected: false, confidence: 0, quality: "unclear",
        message: "Detection error",
        species: null, scientificName: null, freshness: "unknown"
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});