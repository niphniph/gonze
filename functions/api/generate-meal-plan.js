export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestData;
    try {
      requestData = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const { userId, answers } = requestData;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (!answers) {
      return new Response(JSON.stringify({ error: "Missing questionnaire answers" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const openAiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY;
    if (!openAiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API Key is not configured on the server." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const prompt = `
Create a personalized 7-day meal plan based on this user data:

Age: ${answers.age || answers.ageValue || "not provided"}
Gender: ${answers.gender || "not provided"}
Weight: ${answers.weight || answers.currentWeightValue || "not provided"}
Height: ${answers.height || answers.heightValue || "not provided"}
Goal: ${answers.goal || answers.mainGoal || "not provided"}
Activity level: ${answers.activity || answers.activityLevel || "not provided"}
Diet preference: ${answers.diet || answers.dietPreference || "not provided"}
Allergies: ${answers.allergies || "none"}
Disliked foods: ${answers.dislikedFoods || answers.foodsToAvoid || "none"}

Return the meal plan in Georgian language.

Include:
- breakfast, lunch, dinner, and snacks for each day
- approximate daily calories
- simple grocery list
- practical instructions
- short explanation why this plan fits the user
`;

    let openaiRes;
    let model = "gpt-4.1-mini";

    try {
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are a professional nutritionist and meal plan generator."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });
    } catch (err) {
      console.warn("Direct gpt-4.1-mini request failed, trying fallback:", err.message);
    }

    // Fallback to gpt-4o-mini if gpt-4.1-mini fails
    if (!openaiRes || !openaiRes.ok) {
      model = "gpt-4o-mini";
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are a professional nutritionist and meal plan generator."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });
    }

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return new Response(JSON.stringify({ error: `OpenAI API failed: ${errText}` }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const openaiData = await openaiRes.json();
    const mealPlanText = openaiData.choices[0].message.content;

    // Optional: save to database if authorized
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "https://qklbpwzeihwurtldfjqr.supabase.co";
      const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CqP3cfW9qc4seogWd_xA3Q_kvX_esJr";

      try {
        const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
          method: "PATCH",
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            meal_plan: mealPlanText,
            questionnaire_answers: answers
          })
        });

        if (!updateRes.ok) {
          const errText = await updateRes.text();
          console.warn(`Failed to update meal plan in Supabase: ${errText}`);
        }
      } catch (err) {
        console.warn("Database save failed in generate-meal-plan:", err.message);
      }
    }

    return new Response(JSON.stringify({ mealPlan: mealPlanText }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
