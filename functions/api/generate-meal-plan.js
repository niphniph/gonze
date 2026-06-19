function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

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

    const { answers } = requestData;

    if (!answers) {
      return new Response(JSON.stringify({ error: "Meal plan answers not found" }), {
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
Create a personalized 7-day meal plan based on these answers:

Age: ${answers.age || answers.ageValue || 'N/A'}
Gender: ${answers.gender || 'N/A'}
Weight: ${answers.weight || answers.currentWeightValue || 'N/A'}
Height: ${answers.height || answers.heightValue || 'N/A'}
Goal: ${answers.goal || answers.mainGoal || 'N/A'}
Activity level: ${answers.activity || answers.activityLevel || 'N/A'}
Diet preference: ${answers.diet || answers.dietPreference || 'N/A'}
Allergies: ${answers.allergies || 'N/A'}
Foods disliked: ${answers.dislikedFoods || answers.foodsToAvoid || 'N/A'}

Include:
- breakfast, lunch, dinner, snacks
- calories per day
- simple grocery list
- practical instructions
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
            { role: "system", content: "You are a professional nutrition meal plan generator." },
            { role: "user", content: prompt }
          ]
        })
      });
    } catch (err) {
      console.warn("Direct gpt-4.1-mini request failed, trying fallback:", err.message);
    }

    // Fallback to gpt-4o-mini if gpt-4.1-mini fails (since it's not a standard OpenAI model identifier)
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
            { role: "system", content: "You are a professional nutrition meal plan generator." },
            { role: "user", content: prompt }
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

    // Save to database if auth token is present
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "https://qklbpwzeihwurtldfjqr.supabase.co";
      const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CqP3cfW9qc4seogWd_xA3Q_kvX_esJr";

      const token = authHeader.split(" ")[1];
      let userId = null;

      if (token.startsWith("mock_token_for_")) {
        const email = token.replace("mock_token_for_", "");
        userId = email.split("@")[0];
      } else {
        const decoded = decodeJwt(token);
        if (decoded) {
          userId = decoded.sub || decoded.email?.split("@")[0] || "guest_user";
        }
      }

      let verifiedUserId = userId;

      try {
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": authHeader
          }
        });

        if (userRes.ok) {
          const user = await userRes.json();
          verifiedUserId = user.id || verifiedUserId;
        }
      } catch (err) {
        console.warn("Could not verify user token in generate-meal-plan:", err.message);
      }

      if (verifiedUserId) {
        try {
          const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${verifiedUserId}`, {
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
