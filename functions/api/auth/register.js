import { hashPassword, sendEmail, getVerificationEmailTemplate, corsHeaders, handleOptions } from './authUtils.js';

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

    const body = await request.json();
    const name = body.name;
    const email = body.email || body.username;
    const username = body.username || body.email;
    const password = body.password;
    const confirmPassword = body.confirmPassword || body.password;

    // 1. Validation
    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: "ყველა ველი სავალდებულოა" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (password !== confirmPassword) {
      return new Response(JSON.stringify({ error: "პაროლები არ ემთხვევა ერთმანეთს" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Check if user already exists
    const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").bind(cleanEmail).first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email is already registered" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 3. Hash password and generate verification code
    const pwdHash = await hashPassword(password);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Generate random UUID
    const userId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    // 4. Save user to DB
    await db.prepare(
      "INSERT INTO users (id, full_name, email, password_hash, is_verified, verification_code, verification_code_expires, created_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)"
    )
    .bind(userId, name.trim(), cleanEmail, pwdHash, code, codeExpires, nowIso)
    .run();

    // Create empty tracker data row for this user
    await db.prepare("INSERT OR IGNORE INTO tracker_data (user_id) VALUES (?)").bind(userId).run();

    // 5. Send verification email
    const appUrl = env.APP_URL || "http://localhost:5173";
    const verificationLink = `${appUrl}/verify-email?code=${code}&email=${encodeURIComponent(cleanEmail)}`;
    
    const emailHtml = getVerificationEmailTemplate(name, code, verificationLink);
    await sendEmail({
      to: cleanEmail,
      subject: "Verify your email address - Productivity Tracker",
      html: emailHtml
    }, env);

    return new Response(JSON.stringify({
      success: true,
      message: "Registration successful. Please check your email for the verification code.",
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
