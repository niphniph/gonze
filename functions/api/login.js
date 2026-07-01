import { verifyPassword, signJwt, corsHeaders, handleOptions } from './auth/authUtils.js';

export async function onRequest(context) {
  const optionsResponse = handleOptions(context.request);
  if (optionsResponse) return optionsResponse;

  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  const { request, env } = context;
  const db = env.DB;
  if (!db) {
    console.error("Cloudflare D1 database binding 'DB' is missing in environment.");
    return new Response(JSON.stringify({ error: "Database is not connected. Please configure Cloudflare D1 binding named DB." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user by email
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. Check password
    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 3. If email_verified = 0, block login
    if (user.email_verified === 0) {
      return new Response(JSON.stringify({
        error: "Please verify your email first.",
        notVerified: true,
        email: user.email
      }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 4. Generate JWT
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) {
      return new Response(JSON.stringify({ error: "JWT secret is not configured on the server." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.full_name,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days expiration
    };

    const token = await signJwt(payload, jwtSecret);

    // 5. Return token and user
    return new Response(JSON.stringify({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        email_verified: true
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
