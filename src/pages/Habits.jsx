import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { db } from '../utils/db';

const generateHabitId = () => `habit-${Date.now()}`;

export const Habits = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [habitsList, setHabitsList] = useState(() => { const data = db.getHabits(); return data.list || []; });
  const [habitHistory, setHabitHistory] = useState(() => { const data = db.getHabits(); return data.history || {}; });
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('ჯანმრთელობა 💪');
  const [isAdding, setIsAdding] = useState(false);

  const currentYear = 2026;
  const currentMonthIdx = 5;
  const monthDaysCount = 30;
  const monthName = t("ივნისი", "June");

  const updateHabitsState = (newList, newHistory) => {
    setHabitsList(newList);
    setHabitHistory(newHistory);
    db.saveHabits(newList, newHistory);
  };

  const handleToggleHabit = (habitId, dateStr) => {
    const updatedHistory = { ...habitHistory };
    if (!updatedHistory[habitId]) updatedHistory[habitId] = {};
    updatedHistory[habitId][dateStr] = !updatedHistory[habitId][dateStr];
    updateHabitsState(habitsList, updatedHistory);
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const habitId = generateHabitId();
    const newHabit = { id: habitId, name: newHabitName, category: newHabitCategory };
    const updatedList = [...habitsList, newHabit];
    const updatedHistory = { ...habitHistory };
    updatedHistory[habitId] = {};
    updateHabitsState(updatedList, updatedHistory);
    setNewHabitName('');
    setIsAdding(false);
  };

  const handleDeleteHabit = (habitId) => {
    const updatedList = habitsList.filter(h => h.id !== habitId);
    const updatedHistory = { ...habitHistory };
    delete updatedHistory[habitId];
    updateHabitsState(updatedList, updatedHistory);
  };

  const getJuneDates = () => {
    const dates = [];
    for (let d = 1; d <= monthDaysCount; d++) {
      const dateStr = `${currentYear}-06-${String(d).padStart(2, '0')}`;
      const dayObj = new Date(currentYear, currentMonthIdx, d);
      const dayName = dayObj.toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US', { weekday: 'short' });
      dates.push({ dateStr, label: `${dayName} ${d}`, dayNum: d });
    }
    return dates;
  };
  const juneDates = getJuneDates();

  const getPast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx, 7);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US', { weekday: 'short' }) + ' ' + d.getDate();
      dates.push({ dateStr, label });
    }
    return dates;
  };
  const past7Days = getPast7Days();

  const translateCategory = (cat) => {
    if (language === 'ka') return cat;
    const map = { 'ჯანმრთელობა': 'Health', 'განვითარება': 'Development', 'პირადი': 'Personal', 'ფინანსები': 'Finance', 'სამსახური': 'Work', 'სულიერება': 'Spirituality', 'პროდუქტიულობა': 'Productivity' };
    for (const [k, v] of Object.entries(map)) { if (cat.includes(k)) return cat.replace(k, v); }
    return cat;
  };

  const getHabitCompletionStats = (habitId) => {
    const checks = habitHistory[habitId] || {};
    let juneChecks = 0;
    juneDates.forEach(d => { if (checks[d.dateStr]) juneChecks++; });
    return { count: juneChecks, rate: Math.round((juneChecks / monthDaysCount) * 100) };
  };

  return (
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-7xl mx-auto space-y-stack-lg pb-32">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-md text-2xl font-black text-primary-fixed-dim">{t('ჩვევები', 'Habits')}</h2>
          <p className="font-body-md text-on-surface-variant">{t('ჩამოაყალიბეთ სასარგებლო ჩვევები ყოველდღიური თვალყურის დევნებით', 'Form good habits with daily tracking')}</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-primary-fixed-dim text-on-primary-fixed px-6 py-3 rounded-full font-bold text-sm hover:bg-primary-container transition-all active:scale-95 cursor-pointer border-none shadow-lg shadow-primary-fixed-dim/20">
          {isAdding ? t('დახურვა', 'Close') : t('ჩვევის დამატება', 'Add Habit')}
        </button>
      </div>

      {/* Add Habit */}
      {isAdding && (
        <div className="glass-card rounded-xl p-6 md:p-8 border border-primary-fixed-dim/20">
          <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6">{t('ახალი ჩვევის დამატება', 'Add New Habit')}</h3>
          <form onSubmit={handleAddHabit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('ჩვევის სახელი', 'Habit Name')}</label>
              <input type="text" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder={t("შეიყვანეთ ჩვევა...", "Enter habit name...")} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim" required />
            </div>
            <div className="w-full md:w-48">
              <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('კატეგორია', 'Category')}</label>
              <select value={newHabitCategory} onChange={e => setNewHabitCategory(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="ჯანმრთელობა 💪">Health 💪</option>
                <option value="განვითარება 📖">Development 📖</option>
                <option value="პირადი 🗓️">Personal 🗓️</option>
                <option value="ფინანსები 💰">Finance 💰</option>
                <option value="სამსახური 🎯">Work 🎯</option>
                <option value="სულიერება 🧘">Spirituality 🧘</option>
                <option value="პროდუქტიულობა ⚡">Productivity ⚡</option>
              </select>
            </div>
            <button type="submit" className="bg-primary-fixed-dim text-on-primary-fixed px-6 py-2 rounded-full font-bold text-sm hover:bg-primary-container transition-all active:scale-95 cursor-pointer border-none w-full md:w-auto">{t('დამატება', 'Add')}</button>
          </form>
        </div>
      )}

      {/* Habits List */}
      {habitsList.length > 0 ? (
        <div className="space-y-4">
          {habitsList.map(habit => {
            const stats = getHabitCompletionStats(habit.id);
            return (
              <div key={habit.id} className="glass-card rounded-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <h4 className="font-headline-md text-lg font-bold text-on-surface">{habit.name}</h4>
                        <p className="font-label text-xs text-on-surface-variant">{translateCategory(habit.category)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary-fixed-dim rounded-full" style={{ width: `${stats.rate}%` }} />
                      </div>
                      <span className="font-label text-sm text-primary-fixed-dim font-bold">{stats.rate}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {past7Days.map(d => {
                      const isChecked = habitHistory[habit.id]?.[d.dateStr] || false;
                      return (
                        <button key={d.dateStr} onClick={() => handleToggleHabit(habit.id, d.dateStr)} className={`flex flex-col items-center p-2 rounded-lg border transition-all cursor-pointer min-w-[44px] ${isChecked ? 'bg-primary-fixed-dim/10 border-primary-fixed-dim/40' : 'bg-surface-container-low border-outline-variant/20 hover:border-primary-fixed-dim/30'}`}>
                          <span className="font-label text-[9px] text-on-surface-variant">{d.label.split(' ')[0]}</span>
                          <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] mt-1 ${isChecked ? 'bg-primary-fixed-dim border-primary-fixed-dim text-on-primary-fixed' : 'border-outline'}`}>
                            {isChecked && '✓'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => handleDeleteHabit(habit.id)} className="text-on-surface-variant hover:text-error cursor-pointer bg-transparent border-none p-2"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}

          {/* Monthly Matrix */}
          <div className="glass-card rounded-xl p-0 overflow-hidden">
            <div className="p-6 md:p-8 pb-0">
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-1">{t(`${monthName} 2026 - ყოველთვიური მატრიცა`, `${monthName} 2026 - Monthly Matrix`)}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50">
                    <th className="p-3 md:p-4 text-left font-label text-xs text-on-surface-variant sticky left-0 bg-surface-container-lowest z-10">{t('ჩვევა', 'Habit')}</th>
                    {juneDates.map(d => (
                      <th key={d.dateStr} className="p-2 text-center font-label text-[10px] text-on-surface-variant min-w-[36px]">{d.dayNum}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {habitsList.map(habit => (
                    <tr key={habit.id} className="border-b border-outline-variant/10">
                      <td className="p-3 md:p-4 font-bold text-sm text-on-surface sticky left-0 bg-surface-container z-10">{habit.name}</td>
                      {juneDates.map(d => {
                        const isChecked = habitHistory[habit.id]?.[d.dateStr] || false;
                        return (
                          <td key={d.dateStr} className="p-2 text-center">
                            <button onClick={() => handleToggleHabit(habit.id, d.dateStr)} className={`w-6 h-6 rounded border flex items-center justify-center text-xs mx-auto cursor-pointer transition-all ${isChecked ? 'bg-primary-fixed-dim border-primary-fixed-dim text-on-primary-fixed' : 'border-outline-variant/30 bg-transparent hover:border-primary-fixed-dim/50'}`}>
                              {isChecked && '✓'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">repeat</span>
          <p className="text-on-surface-variant">{t("ჯერ ჩვევები არ დამატებულა.", "No habits added yet.")}</p>
        </div>
      )}
    </div>
  );
};
