# Cloudflare Pages & D1 Database Setup Guide

This document provides step-by-step instructions on how to create the Cloudflare Pages project, initialize the D1 database, configure environment variables, and deploy this project.

---

## 1. Create a D1 Database

You can create a D1 database using the Cloudflare Dashboard or the Wrangler CLI.

### Option A: Using Wrangler CLI (Recommended)
Run the following command in your terminal to create a new D1 database:
```bash
npx wrangler d1 create productivity-tracker-db
```
This will output your **Database Name** and **Database ID** (a UUID). Take note of this ID.

### Option B: Using the Cloudflare Dashboard
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** -> **D1**.
3. Click **Create database** -> **D1**.
4. Name the database `productivity-tracker-db` and click **Create**.
5. Copy the **Database ID** shown on the database summary page.

---

## 2. Apply Database Schema

Apply the database schema defined in `schema.sql` to your D1 database:

### For Local Development:
```bash
npx wrangler d1 execute productivity-tracker-db --local --file=./schema.sql
```

### For Production (Remote):
```bash
npx wrangler d1 execute productivity-tracker-db --remote --file=./schema.sql
```

---

## 3. Create Cloudflare Pages Project

### Option A: Connect via GitHub (Automatic Deployment)
1. Go to **Workers & Pages** -> **Overview** -> **Create** -> **Pages** -> **Connect to Git**.
2. Select your repository.
3. Configure the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**.

### Option B: Direct Upload via Wrangler CLI
First, build the production bundle locally:
```bash
npm run build
```
Then, deploy directly using:
```bash
npx wrangler pages deploy dist --project-name=productivity-tracker
```

---

## 4. Bind the D1 Database to Pages

To let your Pages Functions access the database under the `env.DB` object:
1. Go to your Pages project in the Cloudflare Dashboard.
2. Navigate to **Settings** -> **Functions**.
3. Scroll down to **D1 database bindings**.
4. Click **Add binding**.
5. Set:
   - **Variable name**: `DB` (Must be capitalized exactly as `DB`)
   - **D1 database**: Select your newly created `productivity-tracker-db`.
6. Click **Save**.

---

## 5. Add Environment Variables

In your Cloudflare Pages project page, go to **Settings** -> **Environment variables**. Click **Add variables** and add:

1. **`JWT_SECRET`**: A strong, long random string used to sign sessions (e.g. generate via `openssl rand -hex 32`).
2. **`EMAIL_PROVIDER_API_KEY`**: Your API key from **Resend** (e.g. `re_123456789`).
   - *Note: If this key is omitted or left empty, the system runs in Mock mode, automatically printing verification codes and password reset links to the Cloudflare Worker console logs instead of failing.*
3. **`APP_URL`**: The canonical URL of your deployed tracker website (e.g. `https://productivity-tracker.pages.dev`).

Make sure to add these to both the **Production** and **Preview** environments.

---

## 6. How to Test End-to-End

Once deployed:
1. Navigate to `/register`.
2. Enter your Name, Email, and Password. Click **Register**.
3. If `EMAIL_PROVIDER_API_KEY` is configured:
   - Check your inbox/spam folder for the verification email.
   - Click the verification link or enter the 6-digit code on the `/verify-email` page.
4. If running locally or without an email key:
   - Open your terminal running Wrangler or the Cloudflare dashboard real-time logs.
   - Look for the printed box containing the **MOCK EMAIL SENT** details and the 6-digit verification code.
   - Copy the code and enter it on the `/verify-email` page, or construct the URL link printed.
5. Once verified, log in at `/login`.
6. You will be redirected to the `/dashboard`. Try adding some tasks, habits, and budgets.
7. Log out or log in with another account; you will see that each user's data remains private and synchronized.
