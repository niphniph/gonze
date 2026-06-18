import { calculateQuestionnairePlan, answersToUserData } from '../utils/questionnairePlan.js';
import { generateMealPlan } from '../utils/mealGenerator.js';
import { generateWorkoutPlan } from '../utils/workoutGenerator.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // Fallbacks for environment variables (VITE_ prefix used in frontend env)
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "https://qklbpwzeihwurtldfjqr.supabase.co";
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CqP3cfW9qc4seogWd_xA3Q_kvX_esJr";

  // 1. Check authenticated user
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized: Missing Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Verify user JWT token against Supabase auth server
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": authHeader
      }
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const user = await userRes.json();
    const userId = user.id;

    // 2. Fetch user questionnaire/profile data
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": authHeader
      }
    });

    if (!profileRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch user profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const profiles = await profileRes.json();
    const profile = profiles[0];

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Check questionnaire data
    const questionnaire = profile.questionnaire_answers;
    if (!questionnaire) {
      return new Response(JSON.stringify({ error: "Questionnaire data is missing" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. Verify payment status (mock success)
    const paymentConfirmed = true; // temporary mock until payment gateway is integrated
    if (!paymentConfirmed) {
      return new Response(JSON.stringify({ error: "Payment required" }), {
        status: 402,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 5. Generate plan using questionnaire answers
    const calculated = calculateQuestionnairePlan(questionnaire);
    const planUserData = answersToUserData(questionnaire);

    // Compute meal plan and workout plan
    const selectedPlanType = profile.selected_plan_type || "nutrition_workout_bundle";
    const generatedMealPlan = selectedPlanType.includes("nutrition")
      ? generateMealPlan(calculated.calories, calculated.macros, planUserData)
      : null;

    const generatedWorkoutPlan = selectedPlanType.includes("workout")
      ? generateWorkoutPlan(planUserData)
      : null;

    // 6. Save plans to the database
    // We update the profiles table for this user with all calculated metrics
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        user_data: planUserData,
        calculated_plan: calculated,
        meal_plan: generatedMealPlan,
        workout_plan: generatedWorkoutPlan,
        target_calories: calculated.calories,
        macros: calculated.macros,
        tdee: calculated.tdee
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return new Response(JSON.stringify({ error: `Failed to save plan: ${errText}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const updatedProfiles = await updateRes.json();

    // Return the generated plan details formatted exactly as requested
    const savedMealPlan = {
      id: userId,
      userId: userId,
      content: generatedMealPlan,
      status: "active",
      updatedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      mealPlan: savedMealPlan,
      workoutPlan: generatedWorkoutPlan,
      calculatedPlan: calculated,
      userData: planUserData,
      targetCalories: calculated.calories,
      macros: calculated.macros,
      tdee: calculated.tdee
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred during generation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
