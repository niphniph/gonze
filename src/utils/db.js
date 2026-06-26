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

// Seed data - now set to empty by default
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
const initialProfile = { name: "Nikoloz Kapanadze", email: "ninekapanadze@gmail.com" };

// Database API
export const db = {
  // Get all data
  getTasks: () => getStorageItem("tracker_tasks", initialTasks),
  saveTasks: (tasks) => setStorageItem("tracker_tasks", tasks),

  getHabits: () => {
    const list = getStorageItem("tracker_habits", initialHabits);
    const history = getStorageItem("tracker_habits_history", generateHabitHistory());
    return { list, history };
  },
  saveHabits: (list, history) => {
    setStorageItem("tracker_habits", list);
    setStorageItem("tracker_habits_history", history);
  },

  getWeekly: () => getStorageItem("tracker_weekly", initialWeekly),
  saveWeekly: (weekly) => setStorageItem("tracker_weekly", weekly),

  getFinance: () => getStorageItem("tracker_finance", initialFinance),
  saveFinance: (finance) => setStorageItem("tracker_finance", finance),

  // New Integration, Meetings, Calendar, Banking Stores
  getIntegrations: () => getStorageItem("tracker_integrations", initialIntegrations),
  saveIntegrations: (data) => setStorageItem("tracker_integrations", data),

  getMeetings: () => getStorageItem("tracker_meetings", initialMeetings),
  saveMeetings: (data) => setStorageItem("tracker_meetings", data),

  getCalendarEvents: () => getStorageItem("tracker_calendar_events", initialCalendarEvents),
  saveCalendarEvents: (data) => setStorageItem("tracker_calendar_events", data),

  getFinancialAccounts: () => getStorageItem("tracker_financial_accounts", initialFinancialAccounts),
  saveFinancialAccounts: (data) => setStorageItem("tracker_financial_accounts", data),

  getTransactions: () => getStorageItem("tracker_transactions", initialTransactions),
  saveTransactions: (data) => setStorageItem("tracker_transactions", data),

  getFinancialInsights: () => getStorageItem("tracker_financial_insights", initialFinancialInsights),
  saveFinancialInsights: (data) => setStorageItem("tracker_financial_insights", data),

  getBudgets: () => getStorageItem("tracker_budgets", initialBudgets),
  saveBudgets: (data) => setStorageItem("tracker_budgets", data),

  getSavingsGoals: () => getStorageItem("tracker_savings_goals", initialSavingsGoals),
  saveSavingsGoals: (data) => setStorageItem("tracker_savings_goals", data),

  getProfile: () => getStorageItem("tracker_profile", initialProfile),
  saveProfile: (data) => setStorageItem("tracker_profile", data),

  // Clear database to empty seed values
  resetDatabase: () => {
    localStorage.removeItem("tracker_profile");
    localStorage.removeItem("tracker_tasks");
    localStorage.removeItem("tracker_habits");
    localStorage.removeItem("tracker_habits_history");
    localStorage.removeItem("tracker_weekly");
    localStorage.removeItem("tracker_finance");
    localStorage.removeItem("tracker_integrations");
    localStorage.removeItem("tracker_meetings");
    localStorage.removeItem("tracker_calendar_events");
    localStorage.removeItem("tracker_financial_accounts");
    localStorage.removeItem("tracker_transactions");
    localStorage.removeItem("tracker_financial_insights");
    localStorage.removeItem("tracker_budgets");
    localStorage.removeItem("tracker_savings_goals");
    window.location.reload();
  }
};

