import { useState, useEffect } from 'react';
import { db } from '../utils/db';

export const Dashboard = ({ language, setActivePage }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [tasks, setTasks] = useState(() => db.getTasks() || []);
  const [habits, setHabits] = useState(() => db.getHabits() || { list: [], history: {} });
  const [finance, setFinance] = useState(() => db.getFinance() || []);
  const [meetings] = useState(() => db.getMeetings() || []);
  const profile = db.getProfile();
  const todayStr = "2026-06-12";

  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1500);
  const [timerActive, setTimerActive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('task');

  const [taskText, setTaskText] = useState('');
  const [taskCategory, setTaskCategory] = useState('სამსახური 💼');
  const [taskPriority, setTaskPriority] = useState('🔴 მაღალი');
  const [taskStatus] = useState('⚠️ არ დაგიწყია');
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('ჯანმრთელობა 💪');
  const [financeType, setFinanceType] = useState('expense');
  const [financeAmount, setFinanceAmount] = useState('');
  const [financeCategory, setFinanceCategory] = useState('საჭმელი');
  const [financeNote, setFinanceNote] = useState('');

  const todayTasks = tasks.filter(task => task.date === todayStr);
  const todayTasksCompleted = todayTasks.filter(task => task.completed).length;
  const todayTasksPct = todayTasks.length > 0 ? (todayTasksCompleted / todayTasks.length) * 100 : 0;

  const totalHabitListCount = habits.list ? habits.list.length : 0;
  const habitHistory = habits.history || {};
  let todayHabitsCompleted = 0;
  if (habits.list) {
    habits.list.forEach(h => { if (habitHistory[h.id] && habitHistory[h.id][todayStr]) todayHabitsCompleted++; });
  }

  const getHabitStreak = () => {
    if (!habits.list || habits.list.length === 0) return 0;
    let streak = 0;
    let checkDate = new Date(2026, 5, 12);
    const formatDate = (date) => date.toISOString().split('T')[0];
    while (true) {
      const dateStr = formatDate(checkDate);
      let dayCompleted = false;
      habits.list.forEach(h => { if (habits.history && habits.history[h.id] && habits.history[h.id][dateStr]) dayCompleted = true; });
      if (dayCompleted) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
      else { if (streak === 0) { checkDate.setDate(checkDate.getDate() - 1); const yStr = formatDate(checkDate); let yc = false; habits.list.forEach(h => { if (habits.history && habits.history[h.id] && habits.history[h.id][yStr]) yc = true; }); if (yc) { streak++; checkDate.setDate(checkDate.getDate() - 1); continue; } } break; }
    }
    return streak;
  };
  const habitStreak = getHabitStreak();

  const totalIncome = finance.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpense = finance.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const netBalance = totalIncome - totalExpense;

  const calculateAiScore = () => {
    const taskScore = todayTasksPct;
    const habitScore = totalHabitListCount > 0 ? (todayHabitsCompleted / totalHabitListCount) * 100 : 0;
    return Math.round((taskScore * 0.4) + (habitScore * 0.4) + (100 * 0.2)) || 75;
  };
  const aiScore = calculateAiScore();

  const priority1Task = todayTasks.find(t => t.priority && t.priority.includes('მაღალი') && !t.completed) || todayTasks.find(t => !t.completed) || null;
  const todayMeetings = meetings.filter(m => m.date === todayStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const combinedEvents = [
    ...todayMeetings.map(m => ({ id: m.id, time: m.time || "12:00", title: m.title, type: 'meeting', desc: m.description || 'Zoom Meeting' })),
    ...todayTasks.map((t, idx) => {
      const times = ["09:00", "10:30", "15:00", "17:30"];
      return { id: t.id, time: times[idx % times.length], title: t.text || t.name, type: 'task', category: t.category, completed: t.completed };
    })
  ].sort((a, b) => a.time.localeCompare(b.time)).slice(0, 3);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => {
        if (s <= 1) { clearInterval(interval); setTimeout(() => { setTimerActive(false); setTimerSeconds(1500); }, 0); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    const newTask = { id: `task-${Date.now()}`, text: taskText.trim(), name: taskText.trim(), date: todayStr, category: taskCategory, priority: taskPriority, status: taskStatus, completed: false };
    const updated = [...tasks, newTask];
    setTasks(updated); db.saveTasks(updated);
    setTaskText(''); setShowAddModal(false);
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    const newHabit = { id: `habit-${Date.now()}`, name: habitName.trim(), category: habitCategory, streak: 0 };
    const updatedList = [...(habits.list || []), newHabit];
    setHabits({ list: updatedList, history: habits.history });
    db.saveHabits(updatedList, habits.history);
    setHabitName(''); setShowAddModal(false);
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!financeAmount || Number(financeAmount) <= 0) return;
    const newTx = { id: `f-${Date.now()}`, type: financeType, amount: Number(financeAmount), category: financeCategory, date: todayStr, note: financeNote.trim() };
    const updated = [...finance, newTx];
    setFinance(updated); db.saveFinance(updated);
    setFinanceAmount(''); setFinanceNote(''); setShowAddModal(false);
  };

  const handleAcceptAiInsight = () => {
    const tomorrow = new Date(2026, 5, 13);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const newTasks = [...tasks, { id: `task-${Date.now()}`, text: 'Strategic Planning (AI Blocked)', name: 'Strategic Planning (AI Blocked)', date: dateStr, category: 'სამსახური 💼', priority: '🟡 საშუალო', status: '⚠️ არ დაგიწყია', completed: false }];
    setTasks(newTasks); db.saveTasks(newTasks);
  };

  return (
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-[1600px] mx-auto space-y-xl">
      {/* Hero Section & AI Score */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
              {t(`დილა მშვიდობისა, ${profile.name.split(' ')[0]}`, `Good morning, ${profile.name.split(' ')[0]}`)}
            </h3>
            <p className="font-body-lg text-on-surface-variant">{t('მზად ხართ Q3 მიზნებისთვის? დღეს გაქვთ 4 შეხვედრა.', 'Ready to dominate your Q3 objectives? You have 4 meetings today.')}</p>
          </div>
          <div className="glass-card rounded-xl p-8 md:p-10 relative overflow-hidden group cursor-pointer border-l-4 border-l-primary-fixed-dim">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-4 py-1 bg-primary-fixed/20 text-primary-fixed-dim text-[10px] font-bold rounded-full uppercase tracking-widest border border-primary-fixed/30">
                  {t('პრიორიტეტი #1', 'Priority #1')}
                </span>
                {priority1Task && <span className="text-on-surface-variant text-[11px] font-medium uppercase tracking-wider">{t('დღეს შესასრულებელი', 'Due in 3 hours')}</span>}
              </div>
              <h4 className="font-display text-2xl md:text-3xl font-bold text-on-surface mb-8 max-w-2xl leading-tight">
                {priority1Task ? priority1Task.text : t('დღეს ყველა პრიორიტეტული დავალება შესრულებულია!', 'All priority tasks completed for today!')}
              </h4>
              <div className="flex items-center gap-6">
                {priority1Task ? (
                  <>
                    <button onClick={() => setShowTimerModal(true)} className="bg-primary-fixed-dim hover:bg-primary-container text-on-primary-fixed font-black py-4 px-10 rounded-full text-body-md transition-all duration-300 active:scale-95 shadow-xl shadow-primary-fixed/10 cursor-pointer">
                      {t('სესიის დაწყება', 'Start Session')}
                    </button>
                    <button className="bg-surface-container-highest hover:bg-surface-bright border border-outline-variant/30 text-on-surface font-bold py-4 px-10 rounded-full text-body-md transition-all duration-300 cursor-pointer">
                      {t('გადადება', 'Reschedule')}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setShowAddModal(true)} className="bg-primary-fixed-dim hover:bg-primary-container text-on-primary-fixed font-black py-4 px-10 rounded-full text-body-md transition-all duration-300 active:scale-95 cursor-pointer shadow-xl shadow-primary-fixed/10">
                    {t('ახალი დავალება', 'New Task')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="glass-card rounded-xl p-8 md:p-10 flex flex-col items-center justify-center h-full text-center">
            <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-surface-container-highest" cx="80" cy="80" fill="transparent" r="72" stroke="currentColor" strokeWidth="12" />
                <circle className="text-primary-fixed-dim" cx="80" cy="80" fill="transparent" r="72" stroke="currentColor" strokeDasharray="452" strokeDashoffset={452 - (452 * aiScore) / 100} strokeLinecap="round" strokeWidth="12" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-black text-on-surface">{aiScore}</span>
                <span className="font-label text-[10px] text-outline uppercase tracking-widest">/ 100</span>
              </div>
            </div>
            <h5 className="font-headline-md text-xl font-bold text-on-surface mb-4">{t('ეფექტურობის რეიტინგი', 'Efficiency Rating')}</h5>
            <p className="font-body-md text-on-surface-variant leading-relaxed">
              {aiScore > 80
                ? t('თქვენი ფოკუსის ქულა 12%-ით მეტია გასულ კვირასთან შედარებით.', 'Your focus score is 12% higher than last week. Top performance!')
                : t('AI გირჩევთ ფოკუს სესიების გამოყენებას.', 'AI suggests using focus sessions to boost your rating.')}
            </p>
            <div className="mt-8 flex gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-fixed-dim" />
              <span className="w-3 h-3 rounded-full bg-surface-container-highest" />
              <span className="w-3 h-3 rounded-full bg-surface-container-highest" />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div onClick={() => setActivePage('tasks')} className="glass-card rounded-xl p-8 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <span className="font-label text-[11px] font-bold text-green-400 bg-green-400/10 px-4 py-1 rounded-full">{todayTasksPct > 0 ? `+${Math.round(todayTasksPct)}%` : t('დაიწყე', 'Start')}</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium mb-1">{t('შესრულებული დავალებები', 'Tasks Completed')}</p>
          <h6 className="font-display text-3xl font-bold text-on-surface">{Math.round(todayTasksPct)}%</h6>
        </div>
        <div onClick={() => setActivePage('habits')} className="glass-card rounded-xl p-8 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            </div>
            <span className="font-label text-[11px] font-bold text-orange-400 bg-orange-400/10 px-4 py-1 rounded-full">{t('რეკორდი', 'Record')}</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium mb-1">{t('დღიანი Streak', 'Daily Streak')}</p>
          <h6 className="font-display text-3xl font-bold text-on-surface">{habitStreak} {t('დღე', 'Days')}</h6>
        </div>
        <div onClick={() => setActivePage('finance')} className="glass-card rounded-xl p-8 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-full bg-primary-fixed/10 text-primary-fixed-dim flex items-center justify-center">
              <span className="material-symbols-outlined">wallet</span>
            </div>
            <span className="font-label text-[11px] font-bold text-outline bg-surface-container-highest px-4 py-1 rounded-full">{t('თვიური', 'Monthly')}</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium mb-1">{t('ბალანსი', 'Net Balance')}</p>
          <h6 className="font-display text-3xl font-bold text-on-surface">${netBalance.toLocaleString()}</h6>
        </div>
        <div onClick={() => setActivePage('finance_analyzer')} className="glass-card rounded-xl p-8 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-full bg-surface-container-highest text-primary-fixed-dim flex items-center justify-center">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <span className="font-label text-[11px] font-bold text-primary-fixed-dim bg-primary-fixed/10 px-4 py-1 rounded-full">{t('კვირეული', 'Weekly')}</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium mb-3">{t('ზრდის ინდექსი', 'Growth Index')}</p>
          <div className="h-12 w-full flex items-end gap-2">
            <div className="flex-1 bg-surface-container-highest rounded-full h-1/2 hover:bg-primary-fixed-dim transition-all" />
            <div className="flex-1 bg-surface-container-highest rounded-full h-2/3 hover:bg-primary-fixed-dim transition-all" />
            <div className="flex-1 bg-surface-container-highest rounded-full h-1/3 hover:bg-primary-fixed-dim transition-all" />
            <div className="flex-1 bg-surface-container-highest rounded-full h-3/4 hover:bg-primary-fixed-dim transition-all" />
            <div className="flex-1 bg-surface-container-highest rounded-full h-full hover:bg-primary-fixed-dim transition-all" />
            <div className="flex-1 bg-primary-fixed-dim rounded-full h-4/5" />
          </div>
        </div>
      </div>

      {/* Detailed Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter pb-xl">
        <div className="lg:col-span-2 glass-card rounded-xl p-8 md:p-10">
          <div className="flex justify-between items-center mb-10">
            <h6 className="font-headline-md text-xl md:text-2xl font-bold text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-fixed-dim">event</span>
              {t('დღეს დაგეგმილი', 'Upcoming Today')}
            </h6>
            <button onClick={() => setActivePage('planner')} className="font-label text-primary-fixed-dim font-black hover:underline transition-all cursor-pointer bg-transparent border-none">{t('ყველას ნახვა', 'VIEW ALL')}</button>
          </div>
          <div className="space-y-6">
            {combinedEvents.length > 0 ? combinedEvents.map((event) => {
              const isMeeting = event.type === 'meeting';
              const [hStr, mStr] = event.time.split(':');
              const hNum = parseInt(hStr);
              const ampm = hNum >= 12 ? 'PM' : 'AM';
              const dH = hNum > 12 ? hNum - 12 : (hNum === 0 ? 12 : hNum);
              return (
                <div key={event.id} onClick={() => setActivePage(isMeeting ? 'meetings' : 'planner')} className="flex items-center gap-6 p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 hover:border-primary-fixed-dim/30 transition-all cursor-pointer group">
                  <div className={`w-16 h-16 flex flex-col items-center justify-center bg-surface-container-highest rounded-full border border-outline-variant/30 ${isMeeting ? 'text-primary-fixed-dim' : 'text-outline'}`}>
                    <span className="text-sm font-black">{dH}:{mStr}</span>
                    <span className="font-label text-[10px] opacity-60">{ampm}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline-md text-lg font-bold text-on-surface group-hover:text-primary-fixed-dim transition-colors">{event.title}</h4>
                    <p className="font-body-md text-on-surface-variant">{isMeeting ? event.desc : `${event.category} • Task`}</p>
                  </div>
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-4 border-surface-container-low overflow-hidden ring-1 ring-outline-variant/30">
                      <img className="w-full h-full object-cover" alt="avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDD5gk8BPQAFv0i_VlmGU2585g0mTvK-Kf-GXr9_zJEQu0Zhuwc497PawFAke73iHw8bTzwu_Mo8IaeTk-ij3L6n-NuJGDZaD7hS0CaUSM6Pvk7ZAepZvHjFbtuY5ETkFaCjzcLiODryO9jYv8XLBJencZOrnUfSWaPaFmSot-MZDASx3HaTmu5Tydwp8DnZlXO-PwLExbXVs433yRjcVAvP9tyW8wzwOrhek8Pcp-WBscJzvdJ4FzDguWw9F0-kxvnZlsK7diiC4U" />
                    </div>
                    <div className="w-10 h-10 rounded-full border-4 border-surface-container-low overflow-hidden ring-1 ring-outline-variant/30">
                      <img className="w-full h-full object-cover" alt="avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBsPw-WiMqYZ9SUvuy1V0naYBvZteD1_3QCfrR2S-Z272fgT5rbYQuc33RPl6geEm0_H4oZsZUKVJRFe85jfqGbH5FpUJdHw7VjHGqHgz6-rk8d6S7xfKT74AyDzKBpZo3fnpon_lXgdUm7aO4EPr83jnx3llfPDifoZCk5xNRmKB1wACUbArELyVp7Yskfb-BH8fvJ0YPJZFFlaG61AgUI8LL5KUTRhJ9Bq8WtNgNSLY-LM8OoS5gjwMYN-ZoQBJ1RFp-XlBRMdY" />
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-10 text-on-surface-variant font-body-md bg-surface-container-low border border-outline-variant/10 rounded-xl">
                {t('დღეს დაგეგმილი ღონისძიებები არ არის.', 'No upcoming events today.')}
              </div>
            )}
          </div>
        </div>
        <div className="glass-card rounded-xl p-8 md:p-10 bg-surface-container-highest overflow-hidden relative">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary-fixed/10 blur-[80px] rounded-full" />
          <h6 className="font-headline-md text-xl md:text-2xl font-bold text-on-surface mb-10 flex items-center gap-3 relative z-10">
            <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
            {t('AI ინსაითები', 'AI Insights')}
          </h6>
          <div className="space-y-10 relative z-10">
            <div className="space-y-4">
              <p className="font-label text-[10px] text-primary-fixed-dim font-black uppercase tracking-widest">{t('ეფექტურობის რჩევა', 'Efficiency Tip')}</p>
              <p className="font-body-md text-on-surface leading-relaxed italic border-l-2 border-primary-fixed-dim pl-4 py-1">
                "{t('თქვენ ყველაზე პროდუქტიული ხართ 9:00-დან 11:00-მდე. დაგეგმეთ რთული საქმეები ამ დროს.', 'You are most productive between 9 AM and 11 AM. Schedule your Hardest Task during this window to increase output by 22%.')}"
              </p>
            </div>
            <div className="h-px bg-outline-variant/20 w-full" />
            <div className="space-y-6">
              <p className="font-label text-[10px] text-outline font-black uppercase tracking-widest">{t('შემოთავაზებული მოქმედება', 'Suggested Action')}</p>
              <div className="flex items-start gap-4 p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary-fixed-dim text-xl mt-1">calendar_add_on</span>
                <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                  {t('ხვალისთვის 2 საათის დაბლოკვა სტრატეგიული დაგეგმვისთვის.', 'Auto-block 2 hours tomorrow for "Strategic Planning" based on your workload.')}
                </p>
              </div>
              <button onClick={handleAcceptAiInsight} className="w-full py-4 bg-primary-fixed/10 hover:bg-primary-fixed/20 text-primary-fixed-dim font-black rounded-full transition-all border border-primary-fixed-dim/20 cursor-pointer">
                {t('რეკომენდაციის მიღება', 'Accept Recommendation')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setShowAddModal(true)} className="fixed bottom-24 md:bottom-8 right-margin-mobile md:right-8 w-14 h-14 bg-primary-fixed-dim text-on-primary-fixed rounded-full shadow-[0_8px_24px_rgba(0,219,233,0.4)] flex items-center justify-center z-[60] active:scale-90 hover:scale-105 cursor-pointer transition-all border-none">
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'wght' 600" }}>add</span>
      </button>

      {/* Timer Modal */}
      {showTimerModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center relative border border-primary-fixed-dim/20 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">{t('ღრმა მუშაობის სესია', 'Deep Focus Session')}</h3>
            <p className="text-sm text-on-surface-variant mb-6">{priority1Task?.text}</p>
            <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.04)" strokeWidth="6" fill="transparent" />
                <circle cx="96" cy="96" r="88" stroke="#00dbe9" strokeWidth="6" fill="transparent" strokeDasharray={552} strokeDashoffset={552 - (552 * timerSeconds) / 1500} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <span className="absolute text-3xl font-bold text-white font-mono">{Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}</span>
            </div>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setTimerActive(!timerActive)} className="bg-primary-fixed-dim text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-primary-fixed-dim/80 active:scale-95 cursor-pointer border-none">
                {timerActive ? t('პაუზა', 'Pause') : t('დაწყება', 'Start')}
              </button>
              <button onClick={() => { setTimerActive(false); setTimerSeconds(1500); }} className="bg-surface-container-highest text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-surface-bright active:scale-95 cursor-pointer border-none">
                {t('რესეტი', 'Reset')}
              </button>
            </div>
            <button onClick={() => { setTimerActive(false); setShowTimerModal(false); }} className="mt-6 text-xs text-on-surface-variant hover:text-white cursor-pointer bg-transparent border-none">
              {t('დახურვა', 'Close')}
            </button>
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full relative border border-outline-variant/30 shadow-2xl">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-white cursor-pointer bg-transparent border-none">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex border-b border-outline-variant/30 mb-6 pb-2">
              {['task', 'habit', 'finance'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 text-center py-2 font-bold text-sm cursor-pointer border-b-2 transition-all border-none ${activeTab === tab ? 'border-primary-fixed-dim text-primary-fixed-dim' : 'border-transparent text-on-surface-variant'}`}>
                  {tab === 'task' ? t('დავალება', 'Task') : tab === 'habit' ? t('ჩვევა', 'Habit') : t('ფინანსები', 'Finance')}
                </button>
              ))}
            </div>
            {activeTab === 'task' && (
              <form onSubmit={handleAddTask} className="space-y-4">
                <input type="text" value={taskText} onChange={e => setTaskText(e.target.value)} placeholder={t('დავალების სახელი...', 'Task title...')} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim" required />
                <div className="grid grid-cols-2 gap-4">
                  <select value={taskCategory} onChange={e => setTaskCategory(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    <option>სამსახური 💼</option><option>ჯანმრთელობა 💪🏻</option><option>ფული ₿</option><option>ოჯახი 👨‍👩‍👧‍👦</option><option>პირადი განვითარება 📚</option>
                  </select>
                  <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    <option>🔴 მაღალი</option><option>🟡 საშუალო</option><option>🔵 დაბალი</option><option>⚪️ სურვილისამებრ</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-primary-fixed-dim text-on-primary-fixed py-2.5 rounded-full font-bold text-sm cursor-pointer hover:bg-primary-container active:scale-[0.98] transition-all border-none">{t('დავალების დამატება', 'Add Task')}</button>
              </form>
            )}
            {activeTab === 'habit' && (
              <form onSubmit={handleAddHabit} className="space-y-4">
                <input type="text" value={habitName} onChange={e => setHabitName(e.target.value)} placeholder={t('ჩვევის სახელი...', 'Habit name...')} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim" required />
                <select value={habitCategory} onChange={e => setHabitCategory(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  <option>ჯანმრთელობა 💪</option><option>განვითარება 📚</option><option>სულიერება 🧘</option><option>პროდუქტიულობა ⚡</option>
                </select>
                <button type="submit" className="w-full bg-primary-fixed-dim text-on-primary-fixed py-2.5 rounded-full font-bold text-sm cursor-pointer hover:bg-primary-container active:scale-[0.98] transition-all border-none">{t('ჩვევის დამატება', 'Add Habit')}</button>
              </form>
            )}
            {activeTab === 'finance' && (
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <select value={financeType} onChange={e => setFinanceType(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    <option value="expense">{t('ხარჯი', 'Expense')}</option><option value="income">{t('შემოსავალი', 'Income')}</option>
                  </select>
                  <input type="number" value={financeAmount} onChange={e => setFinanceAmount(e.target.value)} placeholder="0.00" className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim" required />
                </div>
                <select value={financeCategory} onChange={e => setFinanceCategory(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  <option>{t('საჭმელი', 'Food')}</option><option>{t('ტრანსპორტი', 'Transport')}</option><option>{t('გართობა', 'Leisure')}</option><option>{t('ბინა', 'Bills/Rent')}</option>
                </select>
                <button type="submit" className="w-full bg-primary-fixed-dim text-on-primary-fixed py-2.5 rounded-full font-bold text-sm cursor-pointer hover:bg-primary-container active:scale-[0.98] transition-all border-none">{t('ტრანზაქციის დამატება', 'Add Transaction')}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
