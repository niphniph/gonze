import { sendEmail, getResetEmailTemplate, corsHeaders, handleOptions } from './authUtils.js';

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

    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch user by email
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
    
    // To prevent email enumeration, we return success even if user does not exist
    if (!user) {
      return new Response(JSON.stringify({
        success: true,
        message: "If the email is registered, a password reset link has been sent."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. Generate secure random token
    const tokenBytes = new Uint8Array(20);
    crypto.getRandomValues(tokenBytes);
    const resetToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour expiration

    // 3. Save reset token to DB
    await db.prepare(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?"
    )
    .bind(resetToken, resetTokenExpires, user.id)
    .run();

    // 4. Send reset email
    const appUrl = env.APP_URL || "http://localhost:5173";
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;
    
    const emailHtml = getResetEmailTemplate(user.full_name, resetLink);
    await sendEmail({
      to: cleanEmail,
      subject: "Reset your password - Productivity Tracker",
      html: emailHtml
    }, env);

    return new Response(JSON.stringify({
      success: true,
      message: "If the email is registered, a password reset link has been sent."
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
