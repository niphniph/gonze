import { hashPassword, sendEmail, corsHeaders, handleOptions } from './auth/authUtils.js';

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
    const { fullName, email, password, confirmPassword } = await request.json();

    // 1. Validate fields
    if (!fullName || !email || !password || !confirmPassword) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. Password minimum 8 characters
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters long" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 3. Check confirm password
    if (password !== confirmPassword) {
      return new Response(JSON.stringify({ error: "Passwords do not match" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 4. Check if email already exists
    const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").bind(cleanEmail).first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 5. Hash password
    const pwdHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    // 6. Insert user into D1
    await db.prepare(
      "INSERT INTO users (id, full_name, email, password_hash, email_verified, created_at) VALUES (?, ?, ?, ?, 0, ?)"
    )
    .bind(userId, fullName.trim(), cleanEmail, pwdHash, nowIso)
    .run();

    // Create empty tracker data row for this user
    await db.prepare("INSERT OR IGNORE INTO tracker_data (user_id) VALUES (?)").bind(userId).run();

    // 7. Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 8. Generate verification token
    const token = crypto.randomUUID();

    // 9. Save code and token in verification_codes
    const codeId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours expiration

    await db.prepare(
      "INSERT INTO verification_codes (id, user_id, email, code, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(codeId, userId, cleanEmail, code, token, expiresAt, nowIso)
    .run();

    // 10. Send email with BOTH verification code and link
    const appUrl = env.APP_URL || "https://nine13.site";
    const verificationLink = `${appUrl}/tracker/verify?token=${token}`;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #6200ee;">Verify Your Email Address</h2>
        <p>Hi ${fullName.trim()},</p>
        <p>Thank you for signing up. Please verify your email using one of the following methods:</p>
        
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
      message: "Registration successful. Verification email sent.",
      email: cleanEmail
    }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
