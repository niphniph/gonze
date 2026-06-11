import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, CheckCircle, Award, Calendar, 
  TrendingUp, TrendingDown, DollarSign, Wallet 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { db } from '../utils/db';
import { MetricCard } from '../components/MetricCard';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';

export const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState({ list: [], history: {} });
  const [weekly, setWeekly] = useState({});
  const [finance, setFinance] = useState([]);

  // Load data
  useEffect(() => {
    setTasks(db.getTasks());
    setHabits(db.getHabits());
    setWeekly(db.getWeekly());
    setFinance(db.getFinance());
  }, []);

  const todayStr = "2026-06-07"; // Aligned with the current system date

  // 1. Task Statistics
  const todayTasks = tasks.filter(t => t.date === todayStr);
  const todayTasksCompleted = todayTasks.filter(t => t.completed).length;
  const todayTasksPct = todayTasks.length > 0 ? (todayTasksCompleted / todayTasks.length) * 100 : 0;
  
  const totalTasksCompleted = tasks.filter(t => t.completed).length;

  // 2. Habit Statistics
  const totalHabitListCount = habits.list.length;
  const habitHistory = habits.history;
  
  // Calculate today's habits
  let todayHabitsCompleted = 0;
  habits.list.forEach(h => {
    if (habitHistory[h.id] && habitHistory[h.id][todayStr]) {
      todayHabitsCompleted++;
    }
  });
  const todayHabitsPct = totalHabitListCount > 0 ? (todayHabitsCompleted / totalHabitListCount) * 100 : 0;

  // Calculate habit completion in the past 7 days (June 1 - June 7)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(2026, 5, 7); // June 7, 2026
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    let completedCount = 0;
    habits.list.forEach(h => {
      if (habitHistory[h.id] && habitHistory[h.id][dateStr]) {
        completedCount++;
      }
    });

    const percent = totalHabitListCount > 0 ? Math.round((completedCount / totalHabitListCount) * 100) : 0;
    
    // Day label (e.g. Mon, Tue)
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    last7Days.push({ date: dateStr, name: dayLabel, percent });
  }

  // Calculate overall monthly habit completion rate
  // June has 30 days
  let totalMonthlyChecks = 0;
  Object.keys(habitHistory).forEach(habitId => {
    Object.keys(habitHistory[habitId]).forEach(dateStr => {
      if (dateStr.startsWith("2026-06")) {
        if (habitHistory[habitId][dateStr]) {
          totalMonthlyChecks++;
        }
      }
    });
  });
  const totalPossibleChecks = totalHabitListCount * 30;
  const monthlyHabitsPct = totalPossibleChecks > 0 ? (totalMonthlyChecks / totalPossibleChecks) * 100 : 0;

  // 3. Weekly Tracker stats
  // Check completion for the current week starting "2026-06-07"
  const currentWeek = weekly["2026-06-07"] || {};
  let weeklyTotal = 0;
  let weeklyCompleted = 0;
  Object.values(currentWeek).forEach(dayTasks => {
    dayTasks.forEach(t => {
      weeklyTotal++;
      if (t.completed) {
        weeklyCompleted++;
      }
    });
  });
  const weeklyTrackerPct = weeklyTotal > 0 ? (weeklyCompleted / weeklyTotal) * 100 : 0;

  // 4. Finance Statistics
  const incomeTx = finance.filter(t => t.type === 'income');
  const expenseTx = finance.filter(t => t.type === 'expense');
  
  const totalIncome = incomeTx.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = expenseTx.reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  // Finance chart data: Group expense by category
  const expenseByCategory = {};
  expenseTx.forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Number(t.amount);
  });
  const financeChartData = Object.keys(expenseByCategory).map(cat => ({
    name: cat,
    value: expenseByCategory[cat]
  }));

  const COLORS = [
    'hsl(var(--primary))', 
    'hsl(var(--accent-blue))', 
    'hsl(var(--accent-emerald))', 
    'hsl(var(--accent-amber))', 
    'hsl(var(--accent-rose))',
    '#a855f7',
    '#06b6d4'
  ];

  return (
    <div className="dashboard-page">
      <header className="page-header" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>დეშბორდი</h1>
        <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>დღევანდელი დღის და კვირის რეზიუმე</p>
      </header>

      {/* Grid of KPI Metrics */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2.5rem' 
      }}>
        <MetricCard 
          title="დღევანდელი დავალებები"
          value={`${todayTasksCompleted}/${todayTasks.length}`}
          icon={CheckCircle}
          footerText={`შესრულება: ${Math.round(todayTasksPct)}%`}
        />
        <MetricCard 
          title="დღევანდელი ჩვევები"
          value={`${todayHabitsCompleted}/${totalHabitListCount}`}
          icon={Award}
          footerText={`შესრულება: ${Math.round(todayHabitsPct)}%`}
        />
        <MetricCard 
          title="ფინანსური ბალანსი"
          value={`${netBalance.toLocaleString()} ₾`}
          icon={Wallet}
          footerText={`შემოსავალი: +${totalIncome} ₾ | ხარჯი: -${totalExpense} ₾`}
          className={netBalance >= 0 ? 'balance-positive' : 'balance-negative'}
        />
        <MetricCard 
          title="დასრულებული დავალებები სულ"
          value={totalTasksCompleted}
          icon={LayoutDashboard}
          footerText="ყველა კატეგორიიდან"
        />
      </section>

      {/* Progress Bars Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <GlassCard>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'hsl(var(--primary))' }} />
            <span>პროგრესის ინდიკატორები</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>დღევანდელი დავალებების პროგრესი</span>
              </div>
              <ProgressBar progress={todayTasksPct} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>კვირის გეგმის პროგრესი</span>
              </div>
              <ProgressBar progress={weeklyTrackerPct} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>ჩვევების ყოველთვიური პროგრესი (ივნისი)</span>
              </div>
              <ProgressBar progress={monthlyHabitsPct} />
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Chart Section */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {/* Weekly Habit Adherence Area Chart */}
        <GlassCard style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'hsl(var(--text-primary))' }}>
            ჩვევების კვირის პროგრესი (%)
          </h3>
          <div style={{ flex: 1, width: '100%', minHeight: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="hsl(var(--text-muted))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--text-muted))" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--bg-surface-elevated))', 
                    borderColor: 'var(--border-light)', 
                    borderRadius: '8px',
                    color: 'hsl(var(--text-primary))'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="percent" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPercent)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Expense categories Pie Chart */}
        <GlassCard style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'hsl(var(--text-primary))' }}>
            ხარჯები კატეგორიების მიხედვით
          </h3>
          <div style={{ flex: 1, width: '100%', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {financeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {financeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--bg-surface-elevated))', 
                      borderColor: 'var(--border-light)', 
                      borderRadius: '8px',
                      color: 'hsl(var(--text-primary))'
                    }} 
                    formatter={(value) => `${value} ₾`}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                არ არის ხარჯების მონაცემები
              </div>
            )}
          </div>
        </GlassCard>
      </section>
    </div>
  );
};
