import { getAuthenticatedUser, corsHeaders, handleOptions } from './auth/authUtils.js';

const VALID_COLUMNS = [
  "tasks",
  "habits",
  "habits_history",
  "weekly",
  "finance",
  "integrations",
  "meetings",
  "calendar_events",
  "financial_accounts",
  "transactions",
  "financial_insights",
  "budgets",
  "savings_goals",
  "profile"
];

export async function onRequest(context) {
  const optionsResponse = handleOptions(context.request);
  if (optionsResponse) return optionsResponse;

  const { request, env } = context;
  const db = env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "Database binding DB is missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // 1. Authenticate user
  const payload = await getAuthenticatedUser(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  const userId = payload.sub;

  // Handle GET request: Fetch all tracker data
  if (request.method === "GET") {
    try {
      // Ensure there's a row in tracker_data for this user
      await db.prepare("INSERT OR IGNORE INTO tracker_data (user_id) VALUES (?)").bind(userId).run();

      const row = await db.prepare("SELECT * FROM tracker_data WHERE user_id = ?").bind(userId).first();
      
      const result = {};
      VALID_COLUMNS.forEach(col => {
        const val = row[col];
        result[`tracker_${col}`] = val ? JSON.parse(val) : null;
      });

      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message || "Failed to fetch sync data" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }

  // Handle POST request: Sync a specific tracker key/value
  if (request.method === "POST") {
    try {
      const { key, value } = await request.json();

      if (!key) {
        return new Response(JSON.stringify({ error: "Missing key for synchronization" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (!key.startsWith("tracker_")) {
        return new Response(JSON.stringify({ error: "Invalid sync key format" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const colName = key.replace("tracker_", "");
      if (!VALID_COLUMNS.includes(colName)) {
        return new Response(JSON.stringify({ error: `Sync column "${colName}" is not valid` }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // Ensure a row exists
      await db.prepare("INSERT OR IGNORE INTO tracker_data (user_id) VALUES (?)").bind(userId).run();

      const serializedValue = JSON.stringify(value);

      // Perform SQL update using whitelisted column name
      await db.prepare(
        `UPDATE tracker_data SET ${colName} = ?, updated_at = ? WHERE user_id = ?`
      )
      .bind(serializedValue, Date.now(), userId)
      .run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message || "Failed to synchronize data" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
