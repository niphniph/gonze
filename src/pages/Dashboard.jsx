import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { db } from '../utils/db';

export const Dashboard = ({ language, setActivePage }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);

  // Load Database State
  const [tasks, setTasks] = useState(() => db.getTasks() || []);
  const [habits, setHabits] = useState(() => db.getHabits() || { list: [], history: {} });

  const [finance, setFinance] = useState(() => db.getFinance() || []);
  const [meetings] = useState(() => db.getMeetings() || []);
  const profile = db.getProfile();

  // App Date
  const todayStr = "2026-06-12"; 

  // Modals & Timers State
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 minutes
  const [timerActive, setTimerActive] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('task'); // 'task', 'habit', 'finance'

  // Quick Add Form States
  const [taskText, setTaskText] = useState('');
  const [taskCategory, setTaskCategory] = useState('სამსახური 💼');
  const [taskPriority, setTaskPriority] = useState('🔴 მაღალი');
  const [taskStatus] = useState('⚠️ არ დაგიწყია');
  
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('ჯანმრთელობა 💪');

  const [financeType, setFinanceType] = useState('expense'); // 'income' / 'expense'
  const [financeAmount, setFinanceAmount] = useState('');
  const [financeCategory, setFinanceCategory] = useState('საჭმელი');
  const [financeNote, setFinanceNote] = useState('');

  // 1. Task calculations
  const todayTasks = tasks.filter(task => task.date === todayStr);
  const todayTasksCompleted = todayTasks.filter(task => task.completed).length;
  const todayTasksPct = todayTasks.length > 0 ? (todayTasksCompleted / todayTasks.length) * 100 : 0;

  // 2. Habit calculations
  const totalHabitListCount = habits.list ? habits.list.length : 0;
  const habitHistory = habits.history || {};
  let todayHabitsCompleted = 0;
  if (habits.list) {
    habits.list.forEach(h => {
      if (habitHistory[h.id] && habitHistory[h.id][todayStr]) {
        todayHabitsCompleted++;
      }
    });
  }
  const todayHabitsPct = totalHabitListCount > 0 ? (todayHabitsCompleted / totalHabitListCount) * 100 : 0;

  // Habit Streak
  const getHabitStreak = () => {
    if (!habits.list || habits.list.length === 0) return 0;
    let streak = 0;
    let checkDate = new Date(2026, 5, 12); // June 12, 2026
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    while (true) {
      const dateStr = formatDate(checkDate);
      let dayCompleted = false;
      habits.list.forEach(h => {
        if (habits.history && habits.history[h.id] && habits.history[h.id][dateStr]) {
          dayCompleted = true;
        }
      });
      
      if (dayCompleted) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (streak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayStr = formatDate(checkDate);
          let yesterdayCompleted = false;
          habits.list.forEach(h => {
            if (habits.history && habits.history[h.id] && habits.history[h.id][yesterdayStr]) {
              yesterdayCompleted = true;
            }
          });
          if (yesterdayCompleted) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    return streak;
  };

  const habitStreak = getHabitStreak();

  // 3. Finance calculations
  const totalIncome = finance.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = finance.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  const expenseByCategory = {};
  finance.filter(t => t.type === 'expense').forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Number(t.amount);
  });
  const financeChartData = Object.keys(expenseByCategory).map(cat => ({
    name: cat,
    value: expenseByCategory[cat]
  }));

  const COLORS = ['#00dbe9', '#d1bcff', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

  // 4. Last 7 Days Habit Compliance
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(2026, 5, 12);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    let completedCount = 0;
    if (habits.list) {
      habits.list.forEach(h => {
        if (habits.history && habits.history[h.id] && habits.history[h.id][dateStr]) {
          completedCount++;
        }
      });
    }
    const percent = totalHabitListCount > 0 ? Math.round((completedCount / totalHabitListCount) * 100) : 0;
    last7Days.push({ 
      name: d.toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US', { weekday: 'short' }), 
      percent 
    });
  }

  // 5. Dynamic AI Score (0-100)
  const calculateAiScore = () => {
    const taskScore = todayTasksPct;
    const habitScore = todayHabitsPct;
    const budgetScore = 100; // Mock budget status compliance
    return Math.round((taskScore * 0.4) + (habitScore * 0.4) + (budgetScore * 0.2)) || 75;
  };
  const aiScore = calculateAiScore();

  // 6. Find Priority #1 Task
  const priority1Task = todayTasks.find(t => t.priority.includes('მაღალი') && !t.completed) || todayTasks.find(t => !t.completed) || null;

  // 7. Upcoming Meetings and Tasks
  const todayMeetings = meetings.filter(m => m.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
  const upcomingMeetings = todayMeetings.slice(0, 2);

  // Pomodoro Timer Hook
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => {
        if (s <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            setTimerActive(false);
            setTimerSeconds(1500);
            alert(language === 'ka' ? "სესია დასრულდა! დროა დაისვენოთ." : "Session finished! Time to take a break.");
          }, 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, language]);

  // Quick Add submit handlers
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      text: taskText.trim(),
      name: taskText.trim(),
      date: todayStr,
      category: taskCategory,
      priority: taskPriority,
      status: taskStatus,
      completed: false
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    db.saveTasks(updated);
    
    setTaskText('');
    setShowAddModal(false);
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    const newHabit = {
      id: `habit-${Date.now()}`,
      name: habitName.trim(),
      category: habitCategory,
      streak: 0
    };

    const updatedList = [...(habits.list || []), newHabit];
    setHabits({ list: updatedList, history: habits.history });
    db.saveHabits(updatedList, habits.history);

    setHabitName('');
    setShowAddModal(false);
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!financeAmount || Number(financeAmount) <= 0) return;

    const newTx = {
      id: `f-${Date.now()}`,
      type: financeType,
      amount: Number(financeAmount),
      category: financeCategory,
      date: todayStr,
      note: financeNote.trim()
    };

    const updated = [...finance, newTx];
    setFinance(updated);
    db.saveFinance(updated);

    setFinanceAmount('');
    setFinanceNote('');
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen text-text-primary px-margin-mobile md:px-margin-desktop py-stack-lg max-w-7xl mx-auto space-y-stack-lg pb-32">
      
      {/* Hero Section & AI Score */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Greeting & Priority Card */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h3 className="font-display-lg text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
              {t(`დილა მშვიდობისა, ${profile.name.split(' ')[0]}`, `Good morning, ${profile.name.split(' ')[0]}`)}
            </h3>
            <p className="font-body-lg text-text-secondary">
              {t('მზად ხართ ახალი მიზნების მისაღწევად? დღეს გაქვთ შეხვედრები.', 'Ready to dominate your goals? You have meetings scheduled for today.')}
            </p>
          </div>
          
          {/* Priority Hero Card */}
          <div className="glass-card rounded-xl p-8 md:p-10 relative overflow-hidden group cursor-pointer border-l-4 border-l-primary-fixed-dim flex flex-col justify-between">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-4 py-1 bg-primary-fixed-dim/20 text-primary-fixed-dim text-[10px] font-bold rounded-full uppercase tracking-widest border border-primary-fixed-dim/30">
                  {t('პრიორიტეტი #1', 'Priority #1')}
                </span>
                {priority1Task && (
                  <span className="text-text-secondary text-[11px] font-medium uppercase tracking-wider">
                    {t('დღეს შესასრულებელი', 'Due Today')}
                  </span>
                )}
              </div>
              <h4 className="font-display-lg text-xl md:text-3xl font-bold text-text-primary mb-6 max-w-2xl leading-tight">
                {priority1Task ? priority1Task.text : t('დღეს ყველა პრიორიტეტული დავალება შესრულებულია!', 'All priority tasks completed for today!')}
              </h4>
              <div className="flex items-center gap-4">
                {priority1Task ? (
                  <>
                    <button 
                      onClick={() => setShowTimerModal(true)}
                      className="bg-primary-fixed-dim hover:bg-primary-container text-black font-black py-3 px-8 rounded-full text-body-md transition-all duration-300 active:scale-95 shadow-xl shadow-primary-fixed-dim/10 cursor-pointer"
                    >
                      {t('ფოკუსის დაწყება', 'Start Session')}
                    </button>
                    <button 
                      onClick={() => setActivePage('planner')}
                      className="bg-surface-container-highest hover:bg-surface-bright border border-outline-variant/30 text-text-primary font-bold py-3 px-8 rounded-full text-body-md transition-all duration-300 cursor-pointer"
                    >
                      {t('პლანერი', 'Planner')}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary-fixed-dim hover:bg-primary-container text-black font-black py-3 px-8 rounded-full text-body-md transition-all duration-300 active:scale-95 cursor-pointer shadow-xl shadow-primary-fixed-dim/10"
                  >
                    {t('ახალი დავალება', 'New Task')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Score Card / Efficiency Rating */}
        <div className="lg:col-span-4">
          <div className="glass-card rounded-xl p-8 md:p-10 flex flex-col items-center justify-center h-full text-center">
            <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-surface-container-highest" cx="80" cy="80" fill="transparent" r="72" stroke="currentColor" strokeWidth="10"></circle>
                <circle 
                  className="text-primary-fixed-dim transition-all duration-1000" 
                  cx="80" 
                  cy="80" 
                  fill="transparent" 
                  r="72" 
                  stroke="currentColor" 
                  strokeDasharray="452" 
                  strokeDashoffset={452 - (452 * aiScore) / 100}
                  strokeLinecap="round" 
                  strokeWidth="10"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display-lg text-4xl font-black text-text-primary">{aiScore}</span>
                <span className="font-label-sm text-[10px] text-text-secondary uppercase tracking-widest">/ 100</span>
              </div>
            </div>
            <h5 className="font-headline-md text-xl font-bold text-text-primary mb-2">{t('ეფექტურობის რეიტინგი', 'Efficiency Rating')}</h5>
            <p className="font-body-md text-text-secondary leading-relaxed">
              {aiScore > 80 
                ? t('თქვენი პროდუქტიულობა შესანიშნავია! ასე გააგრძელეთ.', 'Your focus score is higher than last week. Top performance!')
                : t('AI გირჩევთ გამოიყენოთ პომოდოროს ტაიმერი ფოკუსისთვის.', 'AI suggests using Pomodoro Focus Sessions to boost your rating.')}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-stack-md">
        
        {/* Tasks Stats Card */}
        <div 
          onClick={() => setActivePage('tasks')}
          className="glass-card rounded-xl p-stack-md flex flex-col justify-between aspect-square cursor-pointer transition-all hover:scale-[1.02] hover:border-primary-fixed-dim/40 hover:shadow-[0_0_20px_rgba(0,219,233,0.15)] group"
        >
          <div className="flex justify-between items-center">
            <span className="material-symbols-outlined text-text-secondary group-hover:text-primary-fixed-dim transition-colors">assignment</span>
            <span className="font-label-xs text-label-xs text-green-400">+{Math.round(todayTasksPct)}%</span>
          </div>
          <div>
            <p className="font-headline-md text-2xl md:text-3xl font-bold text-text-primary">{todayTasksCompleted}/{todayTasks.length}</p>
            <p className="font-label-sm text-label-sm text-text-secondary">{t('დავალებები', 'Tasks Completed')}</p>
          </div>
        </div>

        {/* Habits Stats Card */}
        <div 
          onClick={() => setActivePage('habits')}
          className="glass-card rounded-xl p-stack-md flex flex-col justify-between aspect-square cursor-pointer transition-all hover:scale-[1.02] hover:border-accent-emerald/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group"
        >
          <div className="flex justify-between items-center">
            <span className="material-symbols-outlined text-text-secondary group-hover:text-accent-emerald transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="font-label-xs text-label-xs text-primary-fixed-dim">{t('აქტიური', 'Active')}</span>
          </div>
          <div>
            <p className="font-headline-md text-2xl md:text-3xl font-bold text-text-primary">{habitStreak}</p>
            <p className="font-label-sm text-label-sm text-text-secondary">{t('დღიანი Streak', 'Day Streak')}</p>
          </div>
        </div>

        {/* Finance Stats Card */}
        <div 
          onClick={() => setActivePage('finance')}
          className="glass-card rounded-xl p-stack-md flex flex-col justify-between aspect-square cursor-pointer transition-all hover:scale-[1.02] hover:border-accent-amber/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
        >
          <div className="flex justify-between items-center">
            <span className="material-symbols-outlined text-text-secondary group-hover:text-accent-amber transition-colors">account_balance_wallet</span>
            <span className="font-label-xs text-label-xs text-green-400">+{totalIncome.toLocaleString()} ₾</span>
          </div>
          <div>
            <p className="font-headline-md text-xl md:text-2xl font-bold text-text-primary truncate">{netBalance.toLocaleString()} ₾</p>
            <p className="font-label-sm text-label-sm text-text-secondary">{t('ბალანსი', 'Net Balance')}</p>
          </div>
        </div>

        {/* Weekly Growth Chart Card */}
        <div 
          onClick={() => setActivePage('finance_analyzer')}
          className="glass-card rounded-xl p-stack-md flex flex-col justify-between aspect-square cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,219,233,0.1)] group"
        >
          <div className="flex justify-between items-center">
            <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors">trending_up</span>
            <span className="font-label-xs text-label-xs text-text-tertiary">7 Days</span>
          </div>
          <div className="h-12 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <Area 
                  type="monotone" 
                  dataKey="percent" 
                  stroke="#00dbe9" 
                  strokeWidth={2}
                  fill="rgba(0, 219, 233, 0.1)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="font-label-sm text-label-sm text-text-secondary mt-1">{t('კვირის ზრდა', 'Weekly Growth')}</p>
        </div>
      </section>

      {/* Charts & Interactive Reports */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Weekly Habit Success Rate Area Chart */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <h3 className="font-title-md text-lg font-bold mb-6 text-text-primary">
            {t('ჩვევების კვირის პროგრესი (%)', 'Weekly Habit Success Rate (%)')}
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00dbe9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00dbe9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E1F28', 
                    borderColor: 'rgba(255,255,255,0.08)', 
                    borderRadius: '12px',
                    color: '#FFFFFF'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="percent" 
                  stroke="#00dbe9" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorPercent)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category Pie Chart */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <h3 className="font-title-md text-lg font-bold mb-6 text-text-primary">
            {t('ხარჯები კატეგორიების მიხედვით', 'Expenses by Category')}
          </h3>
          <div className="w-full h-64 flex items-center justify-center">
            {financeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {financeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E1F28', 
                      borderColor: 'rgba(255,255,255,0.08)', 
                      borderRadius: '12px',
                      color: '#FFFFFF'
                    }} 
                    formatter={(value) => `${value} ₾`}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-text-tertiary text-sm text-center">
                {t('არ არის ხარჯების მონაცემები', 'No expense data available')}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Section */}
      <section className="space-y-stack-md">
        <h3 className="font-title-md text-lg font-bold text-text-primary">{t('დღეს დაგეგმილი', 'Upcoming Today')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
          {/* Next Meeting */}
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map(m => (
              <div key={m.id} className="hairline-border rounded-xl p-4 flex items-center gap-4 bg-surface-container-low/30 backdrop-blur-md">
                <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">June</span>
                  <span className="text-base font-bold text-text-primary leading-none">12</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-md text-body-md font-bold text-text-primary truncate">{m.title}</p>
                  <p className="font-label-sm text-label-sm text-text-secondary">{m.time} • Google Meet</p>
                </div>
                {m.meetLink && (
                  <a href={m.meetLink} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-primary-fixed-dim/10 flex items-center justify-center text-primary-fixed-dim hover:bg-primary-fixed-dim hover:text-white transition-all">
                    <span className="material-symbols-outlined text-lg">videocam</span>
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="hairline-border rounded-xl p-4 flex items-center justify-center bg-surface-container-low/30 min-h-[80px]">
              <span className="text-text-tertiary text-sm">{t('დღეს შეხვედრები არ გაქვთ.', 'No meetings scheduled for today.')}</span>
            </div>
          )}

          {/* Upcoming Deadline */}
          {priority1Task ? (
            <div className="hairline-border rounded-xl p-4 flex items-center gap-4 bg-surface-container-low/30 backdrop-blur-md">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                <span className="material-symbols-outlined">flag</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body-md text-body-md font-bold text-text-primary truncate">{priority1Task.text}</p>
                <p className="font-label-sm text-label-sm text-text-secondary">{t(`ვადა: დღეს • ${priority1Task.category}`, `Due: Today • ${priority1Task.category}`)}</p>
              </div>
              <button 
                onClick={() => {
                  const updated = tasks.map(t => t.id === priority1Task.id ? { ...t, completed: true } : t);
                  setTasks(updated);
                  db.saveTasks(updated);
                }} 
                className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 hover:bg-green-500 hover:text-white transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">check</span>
              </button>
            </div>
          ) : (
            <div className="hairline-border rounded-xl p-4 flex items-center justify-center bg-surface-container-low/30 min-h-[80px]">
              <span className="text-text-tertiary text-sm">{t('დავალებები არ არის.', 'No tasks due today.')}</span>
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-margin-mobile md:bottom-8 md:right-8 w-14 h-14 bg-primary-fixed-dim text-on-primary-fixed rounded-full shadow-[0_8px_24px_rgba(0,219,233,0.4)] flex items-center justify-center z-[60] active:scale-90 hover:scale-105 cursor-pointer transition-all"
      >
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'wght' 600" }}>add</span>
      </button>

      {/* Pomodoro Focus Timer Overlay Modal */}
      {showTimerModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center relative border border-primary-fixed-dim/20 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">{t('ღრმა მუშაობის სესია', 'Deep Focus Session')}</h3>
            <p className="text-sm text-text-secondary mb-6">{priority1Task?.text}</p>
            
            {/* Timer Circle */}
            <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="96" 
                  cy="96" 
                  r="88" 
                  stroke="#00dbe9" 
                  strokeWidth="6" 
                  fill="transparent"
                  strokeDasharray={552}
                  strokeDashoffset={552 - (552 * (timerSeconds / 1500))}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute text-4xl font-extrabold text-white">
                {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setTimerActive(!timerActive)}
                className="bg-primary-fixed-dim text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-primary-fixed-dim/80 active:scale-95 cursor-pointer"
              >
                {timerActive ? t('პაუზა', 'Pause') : t('დაწყება', 'Start')}
              </button>
              <button 
                onClick={() => { setTimerSeconds(1500); setTimerActive(false); }}
                className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
              >
                {t('რესეტი', 'Reset')}
              </button>
              <button 
                onClick={() => { setShowTimerModal(false); setTimerActive(false); }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-red-500/20 active:scale-95 cursor-pointer"
              >
                {t('დახურვა', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Dialog Overlay Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full relative border border-border-hairline shadow-2xl">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            {/* Modal Tabs */}
            <div className="flex border-b border-border-hairline mb-6 pb-2">
              <button 
                onClick={() => setActiveTab('task')}
                className={`flex-1 text-center py-2 font-bold text-sm cursor-pointer border-b-2 transition-all ${activeTab === 'task' ? 'border-primary-fixed-dim text-primary-fixed-dim' : 'border-transparent text-text-secondary'}`}
              >
                {t('დავალება', 'Task')}
              </button>
              <button 
                onClick={() => setActiveTab('habit')}
                className={`flex-1 text-center py-2 font-bold text-sm cursor-pointer border-b-2 transition-all ${activeTab === 'habit' ? 'border-accent-emerald text-accent-emerald' : 'border-transparent text-text-secondary'}`}
              >
                {t('ჩვევა', 'Habit')}
              </button>
              <button 
                onClick={() => setActiveTab('finance')}
                className={`flex-1 text-center py-2 font-bold text-sm cursor-pointer border-b-2 transition-all ${activeTab === 'finance' ? 'border-accent-amber text-accent-amber' : 'border-transparent text-text-secondary'}`}
              >
                {t('ფინანსები', 'Finance')}
              </button>
            </div>

            {/* Tab: Task */}
            {activeTab === 'task' && (
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">{t('დავალების სახელი', 'Task Title')}</label>
                  <input 
                    type="text" 
                    value={taskText} 
                    onChange={e => setTaskText(e.target.value)} 
                    placeholder={t('მაგ. მოხსენების მომზადება', 'e.g. Write monthly report')}
                    className="w-full bg-white/5 border border-border-hairline rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">{t('კატეგორია', 'Category')}</label>
                    <select 
                      value={taskCategory} 
                      onChange={e => setTaskCategory(e.target.value)}
                      className="w-full bg-surface-container-high border border-border-hairline rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim"
                    >
                      <option>სამსახური 💼</option>
                      <option>ჯანმრთელობა 💪🏻</option>
                      <option>ფული ₿</option>
                      <option>ოჯახი 👨‍👩‍👧‍👦</option>
                      <option>პირადი განვითარება 📚</option>
                      <option>საქმეები 🧹</option>
                      <option>იდეები 💡</option>
                      <option>დასვენება 🎮</option>
                      <option>სულიერება 🧘🏻</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">{t('პრიორიტეტი', 'Priority')}</label>
                    <select 
                      value={taskPriority} 
                      onChange={e => setTaskPriority(e.target.value)}
                      className="w-full bg-surface-container-high border border-border-hairline rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim"
                    >
                      <option>🔴 მაღალი</option>
                      <option>🟡 საშუალო</option>
                      <option>🔵 დაბალი</option>
                      <option>⚪️ სურვილისამებრ</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary-fixed-dim text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-primary-fixed-dim/80 active:scale-[0.98] transition-all">
                  {t('დავალების დამატება', 'Add Task')}
                </button>
              </form>
            )}

            {/* Tab: Habit */}
            {activeTab === 'habit' && (
              <form onSubmit={handleAddHabit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">{t('ჩვევის სახელი', 'Habit Title')}</label>
                  <input 
                    type="text" 
                    value={habitName} 
                    onChange={e => setHabitName(e.target.value)} 
                    placeholder={t('მაგ. კითხვა 30 წთ', 'e.g. Read 30 mins')}
                    className="w-full bg-white/5 border border-border-hairline rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-emerald"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">{t('კატეგორია', 'Category')}</label>
                  <select 
                    value={habitCategory} 
                    onChange={e => setHabitCategory(e.target.value)}
                    className="w-full bg-surface-container-high border border-border-hairline rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option>ჯანმრთელობა 💪</option>
                    <option>განვითარება 📖</option>
                    <option>პირადი 🗓️</option>
                    <option>ფინანსები 💰</option>
                    <option>სამსახური 🎯</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-accent-emerald text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-accent-emerald/80 active:scale-[0.98] transition-all">
                  {t('ჩვევის დამატება', 'Add Habit')}
                </button>
              </form>
            )}

            {/* Tab: Finance */}
            {activeTab === 'finance' && (
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-white/5 p-1 rounded-lg border border-border-hairline">
                  <button 
                    type="button" 
                    onClick={() => setFinanceType('expense')}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${financeType === 'expense' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-text-secondary'}`}
                  >
                    {t('ხარჯი', 'Expense')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFinanceType('income')}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${financeType === 'income' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-text-secondary'}`}
                  >
                    {t('შემოსავალი', 'Income')}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">{t('თანხა (₾)', 'Amount (₾)')}</label>
                    <input 
                      type="number" 
                      value={financeAmount} 
                      onChange={e => setFinanceAmount(e.target.value)} 
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-border-hairline rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-amber"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">{t('კატეგორია', 'Category')}</label>
                    <select 
                      value={financeCategory} 
                      onChange={e => setFinanceCategory(e.target.value)}
                      className="w-full bg-surface-container-high border border-border-hairline rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      {financeType === 'expense' ? (
                        <>
                          <option>ქირა</option>
                          <option>საჭმელი</option>
                          <option>კომუნალური</option>
                          <option>ინტერნეტი</option>
                          <option>დაზღვევა</option>
                          <option>ტაქსი</option>
                          <option>გართობა</option>
                          <option>შოპინგი</option>
                          <option>სხვა ხარჯი</option>
                        </>
                      ) : (
                        <>
                          <option>ხელფასი</option>
                          <option>ბიზნესი</option>
                          <option>ბონუსი</option>
                          <option>ფრილანსერობა</option>
                          <option>სხვა შემოსავალი</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">{t('კომენტარი', 'Note')}</label>
                  <input 
                    type="text" 
                    value={financeNote} 
                    onChange={e => setFinanceNote(e.target.value)} 
                    placeholder={t('მაგ. კომუნალურები ივნისის', 'e.g. Electricity bill')}
                    className="w-full bg-white/5 border border-border-hairline rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-amber"
                  />
                </div>

                <button type="submit" className="w-full bg-accent-amber text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-accent-amber/80 active:scale-[0.98] transition-all">
                  {t('ტრანზაქციის დამატება', 'Add Transaction')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
