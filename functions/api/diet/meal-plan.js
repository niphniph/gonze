export async function onRequestGet(context) {
  const { request, env } = context;

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "https://qklbpwzeihwurtldfjqr.supabase.co";
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CqP3cfW9qc4seogWd_xA3Q_kvX_esJr";

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": authHeader
      }
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const user = await userRes.json();
    const userId = user.id;

    // Fetch the active profile
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": authHeader
      }
    });

    if (!profileRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const profiles = await profileRes.json();
    const profile = profiles[0];

    if (!profile || !profile.meal_plan) {
      return new Response(JSON.stringify({ error: "Meal plan not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Return the meal plan formatted exactly as { mealPlan: { content: ... } }
    return new Response(JSON.stringify({
      mealPlan: {
        id: userId,
        userId: userId,
        content: profile.meal_plan,
        status: "active",
        updatedAt: new Date().toISOString()
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
