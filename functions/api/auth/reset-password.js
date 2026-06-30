import { hashPassword, corsHeaders, handleOptions } from './authUtils.js';

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

    const { token, password, confirmPassword } = await request.json();

    if (!token || !password || !confirmPassword) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (password !== confirmPassword) {
      return new Response(JSON.stringify({ error: "Passwords do not match" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Password strength check (min 8 chars, at least one letter and one number)
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters long and contain both letters and numbers" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 1. Fetch user by reset token
    const user = await db.prepare("SELECT * FROM users WHERE reset_token = ?").bind(token).first();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid or expired reset token" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 2. Check if token expired
    if (user.reset_token_expires && Date.now() > user.reset_token_expires) {
      return new Response(JSON.stringify({ error: "Reset token has expired. Please request a new password reset." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 3. Hash new password
    const pwdHash = await hashPassword(password);

    // 4. Update user password and clear token
    await db.prepare(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?"
    )
    .bind(pwdHash, user.id)
    .run();

    return new Response(JSON.stringify({
      success: true,
      message: "Password reset successful! You can now log in with your new password."
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
