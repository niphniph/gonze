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

    const { userId, guestId, answers, language } = requestData;

    if (!userId && !guestId) {
      return new Response(JSON.stringify({ error: "Missing userId or guestId" }), {
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
You are a professional nutritionist.

Create a personalized 7-day meal plan in Georgian language.

User questionnaire:
Age: ${answers.age || answers.Age || answers.ageValue || "not provided"}
Gender: ${answers.gender || answers.Gender || "not provided"}
Weight: ${answers.weight || answers.Weight || answers.currentWeightValue || "not provided"}
Height: ${answers.height || answers.Height || answers.heightValue || "not provided"}
Goal: ${answers.goal || answers.Goal || answers.mainGoal || "not provided"}
Activity level: ${answers.activity || answers.activityLevel || "not provided"}
Diet preference: ${answers.diet || answers.dietPreference || "not provided"}
Allergies: ${answers.allergies || "none"}
Disliked foods: ${answers.dislikedFoods || answers.dislikes || answers.foodsToAvoid || "none"}
Meals per day: ${answers.mealsPerDay || "not provided"}
Budget: ${answers.budget || answers.budgetLevel || "not provided"}
Cooking time: ${answers.cookingTime || "not provided"}

Return:
1. Short user summary
2. 7-day meal plan
3. Breakfast, lunch, dinner, snacks for every day
4. Approximate daily calories
5. Protein/carbs/fat estimate
6. Grocery list
7. Practical preparation tips
8. Notes based on allergies/disliked foods

Use clear Georgian language.
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
              content: "You generate safe, practical, personalized meal plans. You are not a doctor. Avoid medical diagnosis."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7
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
              content: "You generate safe, practical, personalized meal plans. You are not a doctor. Avoid medical diagnosis."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7
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

    // Optional: save to database if authorized and possible
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "https://qklbpwzeihwurtldfjqr.supabase.co";
    const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CqP3cfW9qc4seogWd_xA3Q_kvX_esJr";
    const authHeader = request.headers.get("Authorization");

    if (userId && authHeader && authHeader.startsWith("Bearer ")) {
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
          console.warn(`Failed to update meal plan in Supabase profile: ${errText}`);
        }
      } catch (err) {
        console.warn("Database profiles save failed in generate-meal-plan:", err.message);
      }
    }

    // Try logging in a separate meal_plans table if it exists
    try {
      const headers = {
        "apikey": supabaseAnonKey,
        "Content-Type": "application/json"
      };
      if (authHeader) {
        headers["Authorization"] = authHeader;
      }
      const mealPlansRes = await fetch(`${supabaseUrl}/rest/v1/meal_plans`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          user_id: userId || null,
          guest_id: guestId || null,
          answers: answers,
          meal_plan: mealPlanText
        })
      });
      if (!mealPlansRes.ok) {
        console.warn(`Failed to log in meal_plans: ${await mealPlansRes.text()}`);
      }
    } catch (dbError) {
      console.warn("Meal plan DB save skipped:", dbError.message);
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
