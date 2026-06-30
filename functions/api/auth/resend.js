import { sendEmail, getVerificationEmailTemplate, corsHeaders, handleOptions } from './authUtils.js';

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
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. If already verified, return error
    if (user.is_verified === 1) {
      return new Response(JSON.stringify({ error: "Email is already verified" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 3. Re-generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // 4. Update code in DB
    await db.prepare(
      "UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE id = ?"
    )
    .bind(code, codeExpires, user.id)
    .run();

    // 5. Resend verification email
    const appUrl = env.APP_URL || "http://localhost:5173";
    const verificationLink = `${appUrl}/verify-email?code=${code}&email=${encodeURIComponent(cleanEmail)}`;
    
    const emailHtml = getVerificationEmailTemplate(user.name, code, verificationLink);
    await sendEmail({
      to: cleanEmail,
      subject: "Verify your email address - Productivity Tracker",
      html: emailHtml
    }, env);

    return new Response(JSON.stringify({
      success: true,
      message: "Verification code resent successfully"
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
