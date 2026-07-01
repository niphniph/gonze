import { getAuthenticatedUser, corsHeaders, handleOptions } from './authUtils.js';

export async function onRequest(context) {
  const optionsResponse = handleOptions(context.request);
  if (optionsResponse) return optionsResponse;

  if (context.request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  try {
    const { request, env } = context;
    const db = env.DB;
    if (!db) {
      console.error("Cloudflare D1 database binding 'DB' is missing in environment.");
      return new Response(JSON.stringify({ error: "Database is not connected. Please configure Cloudflare D1 binding named DB." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 1. Authenticate user
    const payload = await getAuthenticatedUser(request, env);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. Fetch latest user state from DB
    const user = await db.prepare("SELECT id, full_name, email, email_verified FROM users WHERE id = ?").bind(payload.sub).first();
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const userName = user.full_name || 'User';

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        name: userName,
        email: user.email,
        email_verified: user.email_verified === 1
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
