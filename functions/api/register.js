import { hashPassword, sendEmail, corsHeaders, handleOptions } from './auth/authUtils.js';

export async function onRequest(context) {
  const optionsResponse = handleOptions(context.request);
  if (optionsResponse) return optionsResponse;

  const responseHeaders = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...corsHeaders
  };

  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }), {
      status: 405,
      headers: responseHeaders
    });
  }

  const { request, env } = context;
  const db = env.DB;
  if (!db) {
    console.error("Cloudflare D1 database binding 'DB' is missing in environment.");
    return new Response(JSON.stringify({ success: false, error: { code: "DB_MISSING", message: "Database connection unavailable" } }), {
      status: 500,
      headers: responseHeaders
    });
  }

  try {
    const body = await request.json();
    const fullName = (body.fullName || body.name || body.username || '').trim();
    const email = (body.email || body.username || '').trim().toLowerCase();
    const password = body.password || '';
    const confirmPassword = body.confirmPassword || password;

    // 1. Validate required fields
    if (!fullName) {
      return new Response(JSON.stringify({ success: false, error: { code: "INVALID_NAME", message: "გთხოვთ, მიუთითოთ სრული სახელი." } }), {
        status: 400,
        headers: responseHeaders
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ success: false, error: { code: "INVALID_EMAIL", message: "გთხოვთ, მიუთითოთ სწორი ელფოსტის მისამართი." } }), {
        status: 400,
        headers: responseHeaders
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ success: false, error: { code: "INVALID_PASSWORD", message: "პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს." } }), {
        status: 400,
        headers: responseHeaders
      });
    }

    if (password !== confirmPassword) {
      return new Response(JSON.stringify({ success: false, error: { code: "PASSWORD_MISMATCH", message: "პაროლები არ ემთხვევა ერთმანეთს." } }), {
        status: 400,
        headers: responseHeaders
      });
    }

    // 2. Check if email already exists in D1 users table
    const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existingUser) {
      return new Response(JSON.stringify({ success: false, error: { code: "EMAIL_ALREADY_EXISTS", message: "ეს ელფოსტა უკვე რეგისტრირებულია." } }), {
        status: 409,
        headers: responseHeaders
      });
    }

    // 3. Hash password using Web Crypto compatible function
    const pwdHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    // 4. Insert user into D1 users table
    await db.prepare(
      "INSERT INTO users (id, full_name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(userId, fullName, email, pwdHash, nowIso)
    .run();

    // 5. Ensure tracker_data record exists
    try {
      await db.prepare("INSERT OR IGNORE INTO tracker_data (user_id) VALUES (?)").bind(userId).run();
    } catch (e) {
      // Ignore if table schemas differ
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        fullName: fullName,
        email: email
      }
    }), {
      status: 201,
      headers: responseHeaders
    });

  } catch (error) {
    console.error("D1 Registration Error:", error);
    return new Response(JSON.stringify({ success: false, error: { code: "SERVER_ERROR", message: "სერვერის შეცდომა რეგისტრაციისას." } }), {
      status: 500,
      headers: responseHeaders
    });
  }
}
