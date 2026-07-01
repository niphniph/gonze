import { corsHeaders, handleOptions } from './auth/authUtils.js';

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
    const body = await request.json();
    const { email, code, token } = body;

    let verificationRecord = null;

    if (token) {
      // Find by token
      verificationRecord = await db.prepare("SELECT * FROM verification_codes WHERE token = ?").bind(token).first();
    } else if (email && code) {
      // Find by email and code
      const cleanEmail = email.trim().toLowerCase();
      verificationRecord = await db.prepare("SELECT * FROM verification_codes WHERE email = ? AND code = ?").bind(cleanEmail, code.trim()).first();
    } else {
      return new Response(JSON.stringify({ error: "Either email and code, or token is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (!verificationRecord) {
      return new Response(JSON.stringify({ error: "Invalid verification code or token" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Check expiration
    const expiresAt = new Date(verificationRecord.expires_at);
    if (new Date() > expiresAt) {
      return new Response(JSON.stringify({ error: "Verification code or token has expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Set users.email_verified = 1
    await db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").bind(verificationRecord.user_id).run();

    // Delete used verification code/token
    await db.prepare("DELETE FROM verification_codes WHERE id = ?").bind(verificationRecord.id).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Email verified successfully. You can now log in."
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
