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

  // Clear database to empty seed values
  resetDatabase: () => {
    localStorage.removeItem("gonze_tasks");
    localStorage.removeItem("gonze_habits");
    localStorage.removeItem("gonze_habits_history");
    localStorage.removeItem("gonze_weekly");
    localStorage.removeItem("gonze_finance");
    window.location.reload();
  }
};
