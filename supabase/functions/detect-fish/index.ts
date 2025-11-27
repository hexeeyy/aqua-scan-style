import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Quick fish detection using Lovable AI
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
            content: `You are a fish detection system. Analyze if the image contains a fish and return ONLY a JSON object with this structure:
{
  "fishDetected": true/false,
  "confidence": 0-100,
  "quality": "good/poor/unclear",
  "message": "Brief feedback for user"
}

Detection criteria:
- fishDetected: true if a fish is clearly visible
- confidence: 0-100 (80+ for good detection, 50-79 for uncertain, 0-49 for no fish)
- quality: "good" if fish is centered and well-lit, "poor" if blurry/dark, "unclear" if partially visible
- message: Short guidance like "Fish detected! Hold steady", "Move closer", "Improve lighting", "No fish detected"`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Is there a fish in this image? Assess quality and confidence.'
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
        temperature: 0.1,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ 
            fishDetected: false, 
            confidence: 0, 
            quality: "unclear",
            message: "Detection service temporarily unavailable" 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanContent);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in detect-fish function:', error);
    return new Response(
      JSON.stringify({ 
        fishDetected: false,
        confidence: 0,
        quality: "unclear",
        message: "Detection error"
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
