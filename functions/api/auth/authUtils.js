// Utility functions for Web Crypto password hashing, JWT signing, and Email sending on Cloudflare Workers

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PATCH, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function handleOptions(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

// UTF-8 safe base64url encoding
function base64url(source) {
  const bytes = new TextEncoder().encode(source);
  let binString = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  let encoded = btoa(binString);
  encoded = encoded.replace(/=/g, '');
  encoded = encoded.replace(/\+/g, '-');
  encoded = encoded.replace(/\//g, '_');
  return encoded;
}

// UTF-8 safe base64url decoding
function base64urlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Hash password with PBKDF2 (SHA-256)
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey", "deriveBits"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  const hashBuffer = new Uint8Array(exportedKey);
  
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

// Verify password
export async function verifyPassword(password, storedHash) {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) return false;
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey", "deriveBits"]
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const exportedKey = await crypto.subtle.exportKey("raw", key);
    const hashBuffer = new Uint8Array(exportedKey);
    const currentHashHex = Array.from(hashBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
    return currentHashHex === hashHex;
  } catch {
    return false;
  }
}

// Sign JWT token
export async function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const signatureArray = new Uint8Array(signature);
  const encodedSignature = base64url(String.fromCharCode(...signatureArray));
  
  return `${data}.${encodedSignature}`;
}

// Verify JWT token
export async function verifyJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const signature = new Uint8Array(
      base64urlDecode(encodedSignature).split('').map(c => c.charCodeAt(0))
    );
    
    const isValid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(data));
    if (!isValid) return null;
    
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

// Extract bearer token and verify user session
export async function getAuthenticatedUser(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  
  const token = authHeader.split(" ")[1];
  const secret = env.JWT_SECRET;
  if (!secret) return null;
  
  return await verifyJwt(token, secret);
}

// Send email using Resend API (or fallback to logging)
export async function sendEmail({ to, subject, html }, env) {
  const apiKey = env.EMAIL_PROVIDER_API_KEY;
  if (!apiKey) {
    console.log("==========================================");
    console.log("MOCK EMAIL SENT (EMAIL_PROVIDER_API_KEY not configured):");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log("==========================================");
    return { success: true, mock: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Productivity Tracker <onboarding@resend.dev>",
        to: to,
        subject: subject,
        html: html
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Resend API failed: ${errText}`);
      return { success: false, error: errText };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error("Resend send error:", err);
    return { success: false, error: err.message };
  }
}

// Email templates
export function getVerificationEmailTemplate(name, code, link) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #00dbe9; margin-bottom: 24px;">Verify Your Email Address</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering at Productivity Tracker. To complete your registration, please verify your email address using one of the options below:</p>
      
      <div style="margin: 32px 0; text-align: center;">
        <a href="${link}" style="background-color: #00dbe9; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      
      <p>Or use the 6-digit verification code below:</p>
      <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #333333; margin: 20px 0;">
        ${code}
      </div>
      
      <p style="color: #666666; font-size: 14px; margin-top: 32px;">This verification code and link will expire in 24 hours.</p>
      <p style="color: #999999; font-size: 12px; border-top: 1px solid #eeeeee; padding-top: 16px; margin-top: 32px;">If you did not create an account, you can safely ignore this email.</p>
    </div>
  `;
}

export function getResetEmailTemplate(name, link) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #00dbe9; margin-bottom: 24px;">Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password for your Productivity Tracker account. Click the button below to reset it:</p>
      
      <div style="margin: 32px 0; text-align: center;">
        <a href="${link}" style="background-color: #00dbe9; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      
      <p style="color: #666666; font-size: 14px; margin-top: 32px;">This password reset link will expire in 1 hour.</p>
      <p style="color: #999999; font-size: 12px; border-top: 1px solid #eeeeee; padding-top: 16px; margin-top: 32px;">If you did not request a password reset, please secure your account immediately or ignore this email.</p>
    </div>
  `;
}
