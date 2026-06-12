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

// Database API
export const db = {
  // Get all data
  getTasks: () => getStorageItem("gonze_tasks", initialTasks),
  saveTasks: (tasks) => setStorageItem("gonze_tasks", tasks),

  getHabits: () => {
    const list = getStorageItem("gonze_habits", initialHabits);
    const history = getStorageItem("gonze_habits_history", generateHabitHistory());
    return { list, history };
  },
  saveHabits: (list, history) => {
    setStorageItem("gonze_habits", list);
    setStorageItem("gonze_habits_history", history);
  },

  getWeekly: () => getStorageItem("gonze_weekly", initialWeekly),
  saveWeekly: (weekly) => setStorageItem("gonze_weekly", weekly),

  getFinance: () => getStorageItem("gonze_finance", initialFinance),
  saveFinance: (finance) => setStorageItem("gonze_finance", finance),

  // New Integration, Meetings, Calendar, Banking Stores
  getIntegrations: () => getStorageItem("gonze_integrations", initialIntegrations),
  saveIntegrations: (data) => setStorageItem("gonze_integrations", data),

  getMeetings: () => getStorageItem("gonze_meetings", initialMeetings),
  saveMeetings: (data) => setStorageItem("gonze_meetings", data),

  getCalendarEvents: () => getStorageItem("gonze_calendar_events", initialCalendarEvents),
  saveCalendarEvents: (data) => setStorageItem("gonze_calendar_events", data),

  getFinancialAccounts: () => getStorageItem("gonze_financial_accounts", initialFinancialAccounts),
  saveFinancialAccounts: (data) => setStorageItem("gonze_financial_accounts", data),

  getTransactions: () => getStorageItem("gonze_transactions", initialTransactions),
  saveTransactions: (data) => setStorageItem("gonze_transactions", data),

  getFinancialInsights: () => getStorageItem("gonze_financial_insights", initialFinancialInsights),
  saveFinancialInsights: (data) => setStorageItem("gonze_financial_insights", data),

  getBudgets: () => getStorageItem("gonze_budgets", initialBudgets),
  saveBudgets: (data) => setStorageItem("gonze_budgets", data),

  getSavingsGoals: () => getStorageItem("gonze_savings_goals", initialSavingsGoals),
  saveSavingsGoals: (data) => setStorageItem("gonze_savings_goals", data),

  // Clear database to empty seed values
  resetDatabase: () => {
    localStorage.removeItem("gonze_tasks");
    localStorage.removeItem("gonze_habits");
    localStorage.removeItem("gonze_habits_history");
    localStorage.removeItem("gonze_weekly");
    localStorage.removeItem("gonze_finance");
    localStorage.removeItem("gonze_integrations");
    localStorage.removeItem("gonze_meetings");
    localStorage.removeItem("gonze_calendar_events");
    localStorage.removeItem("gonze_financial_accounts");
    localStorage.removeItem("gonze_transactions");
    localStorage.removeItem("gonze_financial_insights");
    localStorage.removeItem("gonze_budgets");
    localStorage.removeItem("gonze_savings_goals");
    window.location.reload();
  }
};

