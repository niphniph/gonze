import { corsHeaders, handleOptions } from './authUtils.js';

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

    const { email, code } = await request.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: "Email and verification code are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch user by email
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. If already verified, return success immediately
    if (user.is_verified === 1) {
      return new Response(JSON.stringify({
        success: true,
        message: "Email is already verified"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 3. Check if verification code matches
    if (user.verification_code !== code) {
      return new Response(JSON.stringify({ error: "Invalid verification code" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 4. Check if code has expired
    if (user.verification_code_expires && Date.now() > user.verification_code_expires) {
      return new Response(JSON.stringify({ error: "Verification code has expired. Please request a new one." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 5. Update user to verified
    await db.prepare(
      "UPDATE users SET is_verified = 1, verification_code = NULL, verification_code_expires = NULL WHERE id = ?"
    )
    .bind(user.id)
    .run();

    return new Response(JSON.stringify({
      success: true,
      message: "Email verified successfully! You can now log in."
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
