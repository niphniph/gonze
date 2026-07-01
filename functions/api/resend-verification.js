import { sendEmail, corsHeaders, handleOptions } from './auth/authUtils.js';

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
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. If already verified, return message
    if (user.email_verified === 1) {
      return new Response(JSON.stringify({ error: "Email is already verified" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 3. Generate new code/token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomUUID();
    const codeId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours expiration
    const nowIso = new Date().toISOString();

    // Delete existing verification codes for this email first
    await db.prepare("DELETE FROM verification_codes WHERE email = ?").bind(cleanEmail).run();

    // Save new code/token in verification_codes
    await db.prepare(
      "INSERT INTO verification_codes (id, user_id, email, code, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(codeId, user.id, cleanEmail, code, token, expiresAt, nowIso)
    .run();

    // 4. Send email again
    const appUrl = env.APP_URL || "https://nine13.site";
    const verificationLink = `${appUrl}/tracker/verify?token=${token}`;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #6200ee;">Verify Your Email Address</h2>
        <p>Hi ${user.full_name.trim()},</p>
        <p>You requested a new verification email. Please verify your email using one of the following methods:</p>
        
        <p><strong>Option 1: Enter this 6-digit code</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px;">
          ${code}
        </div>
        
        <p><strong>Option 2: Click the verification link below</strong></p>
        <p><a href="${verificationLink}" style="background-color: #6200ee; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${verificationLink}</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">This code and link will expire in 24 hours.</p>
      </div>
    `;

    await sendEmail({
      to: cleanEmail,
      subject: "Verify your email - Nine Tracker",
      html: emailHtml
    }, env);

    return new Response(JSON.stringify({
      success: true,
      message: "Verification email sent successfully."
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
