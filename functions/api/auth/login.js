import { verifyPassword, signJwt, corsHeaders, handleOptions } from './authUtils.js';

export async function onRequest(context) {
  const optionsResponse = handleOptions(context.request);
  if (optionsResponse) return optionsResponse;

  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  try {
    const { request, env } = context;
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: "Database binding DB is missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch user from DB
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. Verify password
    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 3. Block login if email is not verified
    if (user.is_verified === 0) {
      return new Response(JSON.stringify({
        error: "Email is not verified. Please verify your email first.",
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
      name: user.name,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days expiration
    };

    const token = await signJwt(payload, jwtSecret);

    return new Response(JSON.stringify({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_verified: true
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
