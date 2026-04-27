import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  const placeId = Deno.env.get("GOOGLE_PLACE_ID");

  if (!apiKey || !placeId) {
    return new Response(
      JSON.stringify({ error: "Google Places not configured", reviews: [], rating: null, totalRatings: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${placeId}` +
      `&fields=name,rating,user_ratings_total,reviews` +
      `&reviews_sort=newest` +
      `&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Places API error:", data.status, data.error_message);
      return new Response(
        JSON.stringify({ error: data.status, reviews: [], rating: null, totalRatings: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        reviews: data.result.reviews ?? [],
        rating: data.result.rating ?? null,
        totalRatings: data.result.user_ratings_total ?? null,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (err) {
    console.error("get-reviews error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", reviews: [], rating: null, totalRatings: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
