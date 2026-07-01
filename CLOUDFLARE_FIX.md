# Cloudflare Pages & D1 Database Setup Guide

This document describes the exact steps to configure the Cloudflare D1 database binding, initialize the schema, set environment variables, and deploy the application.

---

## 1. Create a D1 Database
Run the following command in your terminal to create the database:
```bash
npx wrangler d1 create nine13-tracker-db
```
This will output the **Database Name** and a **Database ID** (UUID).

---

## 2. Configure Wrangler TOML
Copy the generated `database_id` and paste it into the `wrangler.toml` file in the root of the project:
```toml
name = "nine13-tracker"
compatibility_date = "2025-01-01"

[[d1_databases]]
binding = "DB"
database_name = "nine13-tracker-db"
database_id = "PASTE_D1_DATABASE_ID_HERE"

[vars]
APP_URL = "https://nine13.site"
JWT_SECRET = "CHANGE_THIS_SECRET"
RESEND_API_KEY = "PASTE_RESEND_OR_EMAIL_PROVIDER_KEY_HERE"
FROM_EMAIL = "Nine Tracker <verify@nine13.site>"
```

---

## 3. Apply the Database Schema
Apply the schema defined in `schema.sql` to your remote database:
```bash
npx wrangler d1 execute nine13-tracker-db --file=./schema.sql --remote
```

---

## 4. Add Environment Variables in Cloudflare Dashboard
Go to your **Cloudflare Pages Project Settings** -> **Environment variables** (in both Production and Preview environments) and add the following variables:
- **`JWT_SECRET`**: A strong, long random string used to sign sessions.
- **`RESEND_API_KEY`**: Your API key from Resend (e.g., `re_123456789`).
- **`FROM_EMAIL`**: The verified sender email address in Resend (e.g., `Nine Tracker <verify@nine13.site>`).
- **`APP_URL`**: The URL of your deployed tracker website (e.g., `https://nine13.site`).

---

## 5. Bind the D1 Database to Pages
In the Cloudflare Dashboard, go to your **Pages Project Settings** -> **Functions** -> **D1 database bindings**:
1. Click **Add binding**.
2. Set the **Variable name** exactly to: `DB` (must be capitalized).
3. Set the **D1 database** to: `nine13-tracker-db`.
4. Click **Save**.

---

## 6. Build and Deploy
Build the project and deploy it directly using the Wrangler CLI:
```bash
npm run build
npx wrangler pages deploy dist
```
