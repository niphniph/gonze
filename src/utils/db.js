// Helper to get items from local storage
const getStorageItem = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

// Helper to set items to local storage
const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
  }
};

// Seed data
const initialTasks = [];
const initialHabits = [];
const generateHabitHistory = () => ({});
const initialWeekly = {};
const initialFinance = [];

const initialIntegrations = {
  connected: false,
  demoMode: true,
  clientId: '',
  apiKey: '',
  permissions: { calendar: true, gmail: true },
  profile: null
};
const initialMeetings = [];
const initialCalendarEvents = [];
const initialFinancialAccounts = [];
const initialTransactions = [];
const initialFinancialInsights = [];
const initialBudgets = {};
const initialSavingsGoals = [];
const initialProfile = { name: "User", email: "" };

// Scoped key helper
const saveScopedItem = (key, value) => {
  const email = localStorage.getItem("tracker_email");
  if (email) {
    const cleanKey = key.replace("tracker_", "");
    setStorageItem(`tracker_${email}_${cleanKey}`, value);
  }
};

// Background sync to Cloudflare D1 (if token exists)
const syncToCloudflare = async (key, value) => {
  const token = localStorage.getItem("tracker_token");
  if (!token) return;

  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ key, value })
    });
    if (!res.ok) {
      console.warn(`Sync failed for key ${key}:`, await res.text());
    }
  } catch (err) {
    console.warn(`Background sync error for ${key}:`, err.message);
  }
};

// Database API
export const db = {
  // Get all data
  getTasks: () => getStorageItem("tracker_tasks", initialTasks),
  saveTasks: (tasks) => {
    setStorageItem("tracker_tasks", tasks);
    saveScopedItem("tracker_tasks", tasks);
    syncToCloudflare("tracker_tasks", tasks);
  },

  getHabits: () => {
    const list = getStorageItem("tracker_habits", initialHabits);
    const history = getStorageItem("tracker_habits_history", generateHabitHistory());
    return { list, history };
  },
  saveHabits: (list, history) => {
    setStorageItem("tracker_habits", list);
    setStorageItem("tracker_habits_history", history);
    saveScopedItem("tracker_habits", list);
    saveScopedItem("tracker_habits_history", history);
    syncToCloudflare("tracker_habits", list);
    syncToCloudflare("tracker_habits_history", history);
  },

  getWeekly: () => getStorageItem("tracker_weekly", initialWeekly),
  saveWeekly: (weekly) => {
    setStorageItem("tracker_weekly", weekly);
    saveScopedItem("tracker_weekly", weekly);
    syncToCloudflare("tracker_weekly", weekly);
  },

  getFinance: () => getStorageItem("tracker_finance", initialFinance),
  saveFinance: (finance) => {
    setStorageItem("tracker_finance", finance);
    saveScopedItem("tracker_finance", finance);
    syncToCloudflare("tracker_finance", finance);
  },

  getIntegrations: () => getStorageItem("tracker_integrations", initialIntegrations),
  saveIntegrations: (data) => {
    setStorageItem("tracker_integrations", data);
    saveScopedItem("tracker_integrations", data);
    syncToCloudflare("tracker_integrations", data);
  },

  getMeetings: () => getStorageItem("tracker_meetings", initialMeetings),
  saveMeetings: (data) => {
    setStorageItem("tracker_meetings", data);
    saveScopedItem("tracker_meetings", data);
    syncToCloudflare("tracker_meetings", data);
  },

  getCalendarEvents: () => getStorageItem("tracker_calendar_events", initialCalendarEvents),
  saveCalendarEvents: (data) => {
    setStorageItem("tracker_calendar_events", data);
    saveScopedItem("tracker_calendar_events", data);
    syncToCloudflare("tracker_calendar_events", data);
  },

  getFinancialAccounts: () => getStorageItem("tracker_financial_accounts", initialFinancialAccounts),
  saveFinancialAccounts: (data) => {
    setStorageItem("tracker_financial_accounts", data);
    saveScopedItem("tracker_financial_accounts", data);
    syncToCloudflare("tracker_financial_accounts", data);
  },

  getTransactions: () => getStorageItem("tracker_transactions", initialTransactions),
  saveTransactions: (data) => {
    setStorageItem("tracker_transactions", data);
    saveScopedItem("tracker_transactions", data);
    syncToCloudflare("tracker_transactions", data);
  },

  getFinancialInsights: () => getStorageItem("tracker_financial_insights", initialFinancialInsights),
  saveFinancialInsights: (data) => {
    setStorageItem("tracker_financial_insights", data);
    saveScopedItem("tracker_financial_insights", data);
    syncToCloudflare("tracker_financial_insights", data);
  },

  getBudgets: () => getStorageItem("tracker_budgets", initialBudgets),
  saveBudgets: (data) => {
    setStorageItem("tracker_budgets", data);
    saveScopedItem("tracker_budgets", data);
    syncToCloudflare("tracker_budgets", data);
  },

  getSavingsGoals: () => getStorageItem("tracker_savings_goals", initialSavingsGoals),
  saveSavingsGoals: (data) => {
    setStorageItem("tracker_savings_goals", data);
    saveScopedItem("tracker_savings_goals", data);
    syncToCloudflare("tracker_savings_goals", data);
  },

  getProfile: () => getStorageItem("tracker_profile", initialProfile),
  saveProfile: (data) => {
    setStorageItem("tracker_profile", data);
    saveScopedItem("tracker_profile", data);
    syncToCloudflare("tracker_profile", data);
  },

  // Scopes and loads data for a specific user into active localStorage keys
  loadUserSpecificData: (email) => {
    if (!email) return;
    localStorage.setItem("tracker_email", email);

    const keysMap = {
      tasks: initialTasks,
      habits: initialHabits,
      habits_history: {},
      weekly: initialWeekly,
      finance: initialFinance,
      integrations: initialIntegrations,
      meetings: initialMeetings,
      calendar_events: initialCalendarEvents,
      financial_accounts: initialFinancialAccounts,
      transactions: initialTransactions,
      financial_insights: initialFinancialInsights,
      budgets: initialBudgets,
      savings_goals: initialSavingsGoals,
      profile: { name: email.split("@")[0], email }
    };

    Object.keys(keysMap).forEach(key => {
      const defaultValue = keysMap[key];
      const userValue = getStorageItem(`tracker_${email}_${key}`, null);
      if (userValue !== null) {
        setStorageItem(`tracker_${key}`, userValue);
      } else {
        setStorageItem(`tracker_${key}`, defaultValue);
      }
    });
  },

  // Clears active user session keys
  clearActiveSession: () => {
    const keys = [
      "profile", "tasks", "habits", "habits_history", "weekly", "finance",
      "integrations", "meetings", "calendar_events", "financial_accounts",
      "transactions", "financial_insights", "budgets", "savings_goals"
    ];
    keys.forEach(k => {
      localStorage.removeItem(`tracker_${k}`);
    });
    localStorage.removeItem("tracker_email");
    localStorage.removeItem("tracker_token");
  },

  // Clear database entirely (dangerous, but preserves function name)
  resetDatabase: () => {
    db.clearActiveSession();
    window.location.reload();
  }
};
