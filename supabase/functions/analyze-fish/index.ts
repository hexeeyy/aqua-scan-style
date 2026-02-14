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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { image } = await req.json();
    
    if (!image) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing fish image with AI...');

    // Call Lovable AI with image analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
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
  "commonAreas": ["Visayan Sea", "Manila Bay", "Mindanao waters"]
}

If the image is NOT a fish, return:
{
  "isActuallyFish": false,
  "message": "This is not a fish"
}

IMPORTANT: Use realistic Philippine peso prices based on current market rates. Common fish like tilapia: ₱120-180/kg, bangus: ₱160-220/kg, galunggong: ₱180-280/kg, tuna: ₱300-500/kg, lapu-lapu: ₱400-800/kg. Adjust for freshness.

Be accurate and professional. Confidence should reflect uncertainty (80-95% for clear fish, 60-79% for unclear images).`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this fish image and provide species identification and freshness assessment.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data));

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let result;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate the response structure
    if (result.isActuallyFish === false) {
      // Return "not a fish" response
      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    if (!result.species || !result.freshness || !result.stats || !result.pricePerKilo || !result.habitat || !result.nutritionalInfo || !result.commonAreas) {
      throw new Error('Invalid response structure from AI');
    }

    console.log('Analysis complete:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-fish function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
