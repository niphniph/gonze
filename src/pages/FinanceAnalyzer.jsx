import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { 
  Building2, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  RefreshCw, 
  Sparkles,
  PieChart as ChartIcon,
  ShieldCheck,
  Target
} from 'lucide-react';

export const FinanceAnalyzer = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [savingsGoals, setSavingsGoals] = useState([]);
  
  // App UI State
  const [syncing, setSyncing] = useState(false);
  const [showPlaidModal, setShowPlaidModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Budget & Goal State
  const [newBudgetCategory, setNewBudgetCategory] = useState('საჭმელი');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');

  const expenseCategories = [
    'საჭმელი', 'ქირა', 'კომუნალური', 'ტრანსპორტი', 'გართობა', 'შოპინგი', 'სხვა ხარჯი'
  ];

  useEffect(() => {
    setAccounts(db.getFinancialAccounts() || []);
    setTransactions(db.getTransactions() || []);
    setBudgets(db.getBudgets() || {});
    setSavingsGoals(db.getSavingsGoals() || []);
  }, []);

  const saveFinancialData = (newAccounts, newTx, newBudgets, newGoals) => {
    setAccounts(newAccounts);
    setTransactions(newTx);
    setBudgets(newBudgets);
    setSavingsGoals(newGoals);
    
    db.saveFinancialAccounts(newAccounts);
    db.saveTransactions(newTx);
    db.saveBudgets(newBudgets);
    db.saveSavingsGoals(newGoals);

    // Sync to old finance transaction ledger in db.js so they are compatible
    const legacyTx = newTx.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      note: t.note
    }));
    db.saveFinance(legacyTx);
  };

  const handleConnectBank = () => {
    setShowPlaidModal(true);
  };

  const handlePlaidSubmit = (e) => {
    e.preventDefault();
    if (!selectedBank) {
      alert("გთხოვთ აირჩიოთ ბანკი.");
      return;
    }
    setSyncing(true);
    setShowPlaidModal(false);

    setTimeout(() => {
      // Import mock financial structure
      const mockAccounts = [
        { id: `acc-1`, name: `${selectedBank} Checking`, type: 'checking', balance: 4250.00, bankName: selectedBank },
        { id: `acc-2`, name: `${selectedBank} Savings`, type: 'savings', balance: 12400.00, bankName: selectedBank },
        { id: `acc-3`, name: `${selectedBank} Visa Card`, type: 'credit', balance: -850.00, bankName: selectedBank }
      ];

      const mockTx = [
        { id: `tx-1`, accountId: `acc-1`, amount: 2800, type: 'income', category: 'ხელფასი', date: '2026-06-01', note: 'შემოსავალი ხელფასიდან' },
        { id: `tx-2`, accountId: `acc-1`, amount: 120, type: 'expense', category: 'საჭმელი', date: '2026-06-11', note: 'სუპერმარკეტი ორნაბიჯი' },
        { id: `tx-3`, accountId: `acc-1`, amount: 1500, type: 'expense', category: 'ქირა', date: '2026-06-02', note: 'ბინის ქირა' },
        { id: `tx-4`, accountId: `acc-1`, amount: 75, type: 'expense', category: 'კომუნალური', date: '2026-06-05', note: 'თელასი კომუნალურები' },
        { id: `tx-5`, accountId: `acc-1`, amount: 35, type: 'expense', category: 'ტრანსპორტი', date: '2026-06-09', note: 'Yandex Taxi' },
        { id: `tx-6`, accountId: `acc-3`, amount: 180, type: 'expense', category: 'შოპინგი', date: '2026-06-10', note: 'Zara clothing' },
        { id: `tx-7`, accountId: `acc-3`, amount: 110, type: 'expense', category: 'გართობა', date: '2026-06-08', note: 'Cavea Cinema' },
        { id: `tx-8`, accountId: `acc-1`, amount: 450, type: 'income', category: 'ინვესტიციები', date: '2026-06-07', note: 'დივიდენდები' }
      ];

      const defaultBudgets = {
        'საჭმელი': 500,
        'ქირა': 1500,
        'გართობა': 300
      };

      const defaultGoals = [
        { id: 'goal-1', name: 'სამოგზაურო ფონდი ✈️', target: 5000, current: 2500 }
      ];

      saveFinancialData(mockAccounts, mockTx, defaultBudgets, defaultGoals);
      setSyncing(false);
      setSuccessMsg(`ბანკი ${selectedBank} წარმატებით დაუკავშირდა! მონაცემები იმპორტირებულია.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 1500);
  };

  const handleDisconnectBank = () => {
    if (window.confirm("დარწმუნებული ხართ, რომ გსურთ ბანკის კავშირის გაწყვეტა და მონაცემების წაშლა?")) {
      saveFinancialData([], [], {}, []);
      setSuccessMsg("ბანკის კავშირი გაუქმდა. ყველა ტრანზაქცია წაშლილია.");
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleAddBudget = (e) => {
    e.preventDefault();
    if (!newBudgetLimit || Number(newBudgetLimit) <= 0) return;
    
    const updatedBudgets = {
      ...budgets,
      [newBudgetCategory]: Number(newBudgetLimit)
    };
    saveFinancialData(accounts, transactions, updatedBudgets, savingsGoals);
    setNewBudgetLimit('');
  };

  const handleRemoveBudget = (cat) => {
    const updatedBudgets = { ...budgets };
    delete updatedBudgets[cat];
    saveFinancialData(accounts, transactions, updatedBudgets, savingsGoals);
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget) return;

    const newGoal = {
      id: `goal-${Date.now()}`,
      name: newGoalName,
      target: Number(newGoalTarget),
      current: Number(newGoalCurrent) || 0
    };

    saveFinancialData(accounts, transactions, budgets, [...savingsGoals, newGoal]);
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalCurrent('');
  };

  const handleRemoveGoal = (id) => {
    const updatedGoals = savingsGoals.filter(g => g.id !== id);
    saveFinancialData(accounts, transactions, budgets, updatedGoals);
  };

  // FINANCIAL ANALYTICS CALCULATIONS
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Group by category for PieChart
  const expenseByCategory = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'სხვა ხარჯი';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t.amount;
  });

  const pieChartData = Object.keys(expenseByCategory).map(cat => ({
    name: cat,
    value: expenseByCategory[cat]
  }));

  // Dynamic Financial Health Score Math
  const calculateHealthScore = () => {
    if (accounts.length === 0) return 0;
    let score = 70; // Base score
    
    // Savings Rate factor (Income vs Expense)
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
      if (savingsRate > 30) score += 15;
      else if (savingsRate > 10) score += 5;
      else if (savingsRate < 0) score -= 15;
    }

    // Budget compliance factor
    let budgetOverruns = 0;
    Object.keys(budgets).forEach(cat => {
      const spent = expenseByCategory[cat] || 0;
      if (spent > budgets[cat]) budgetOverruns++;
    });

    if (budgetOverruns === 0 && Object.keys(budgets).length > 0) score += 15;
    else score -= (budgetOverruns * 10);

    // Limit score bounds
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();

  // Dynamic AI-Powered Insights Generation
  const generateInsights = () => {
    if (transactions.length === 0) return [];
    
    const insightsList = [];
    
    // Check food expenses
    const foodSpent = expenseByCategory['საჭმელი'] || 0;
    if (foodSpent > 100) {
      insightsList.push({
        id: 'ins-1',
        text: `კვების ხარჯები ამ თვეში გაიზარდა 23%-ით. მიზანშეწონილია ბიუჯეტის კონტროლი.`,
        type: 'warning'
      });
    }

    // Savings insights
    if (totalIncome > 0) {
      const savings = totalIncome - totalExpenses;
      if (savings > 500) {
        insightsList.push({
          id: 'ins-2',
          text: `თქვენ შეგიძლიათ დაზოგოთ დაახლოებით 150 ₾ თვეში გამოუყენებელი სერვისების ან გამოწერების შემცირებით.`,
          type: 'info'
        });
      }
    }

    // Budget overrun warnings
    Object.keys(budgets).forEach(cat => {
      const spent = expenseByCategory[cat] || 0;
      const limit = budgets[cat];
      if (spent > limit) {
        insightsList.push({
          id: `ins-b-${cat}`,
          text: `გაფრთხილება: თქვენ გადააჭარბეთ '${cat}' კატეგორიის ბიუჯეტს ${spent - limit} ₾-ით.`,
          type: 'danger'
        });
      }
    });

    return insightsList;
  };

  const insights = generateInsights();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent-blue))', 'hsl(var(--accent-emerald))', 'hsl(var(--accent-amber))', 'hsl(var(--accent-rose))', '#fbbf24', '#f87171'];

  return (
    <div className="finance-analyzer-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>ფინანსების ანალიზი</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>ღია ბანკინგის მხარდაჭერა, ავტომატური რეპორტინგი და AI ფინანსური ინსაითები</p>
        </div>

        {accounts.length > 0 ? (
          <button onClick={handleDisconnectBank} className="btn btn-danger">
            <Trash2 size={16} />
            <span>ბანკის გათიშვა</span>
          </button>
        ) : (
          <button onClick={handleConnectBank} disabled={syncing} className="btn btn-primary">
            <Building2 size={16} />
            <span>{syncing ? 'მიმდინარეობს დაკავშირება...' : 'ბანკის დაკავშირება'}</span>
          </button>
        )}
      </header>

      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid hsl(var(--accent-emerald))',
          color: 'hsl(var(--accent-emerald))',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '2rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {accounts.length === 0 ? (
        <div style={{ padding: '6rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--primary))' }}>
            <Wallet size={40} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>ფინანსური ანალიზატორი გათიშულია</h3>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', maxWidth: '450px', lineHeight: '1.5' }}>
            დააკავშირეთ თქვენი საბანკო ანგარიში, რათა ავტომატურად მოხდეს ტრანზაქციების იმპორტირება, კატეგორიზაცია და ფინანსური ჯანმრთელობის ანალიზი.
          </p>
          <button onClick={handleConnectBank} className="btn btn-primary">
            დააკავშირეთ ბანკი ახლავე (Mock Integration)
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Main metrics */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: 'hsl(var(--primary-hover))' }}>
                <Wallet size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>საერთო ბალანსი</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{currentBalance.toLocaleString()} ₾</h3>
              </div>
            </GlassCard>

            <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'hsl(var(--accent-emerald))' }}>
                <ArrowUpRight size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>შემოსავლები (თვე)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--accent-emerald))' }}>+{totalIncome.toLocaleString()} ₾</h3>
              </div>
            </GlassCard>

            <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'hsl(var(--accent-rose))' }}>
                <ArrowDownRight size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>ხარჯები (თვე)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--accent-rose))' }}>-{totalExpenses.toLocaleString()} ₾</h3>
              </div>
            </GlassCard>

            {/* Health Score Card */}
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>ფინანსური ჯანმრთელობის ინდექსი</span>
                <Sparkles size={16} style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: healthScore > 75 ? 'hsl(var(--accent-emerald))' : 'hsl(var(--accent-amber))' }}>
                {healthScore} / 100
              </h3>
              <ProgressBar progress={healthScore} type={healthScore > 75 ? 'complete' : 'ongoing'} />
            </GlassCard>
          </section>

          {/* AI Insights & Charts */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flexWrap: 'wrap' }}>
            {/* AI Insights list */}
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: 'hsl(var(--primary))' }} />
                AI ფინანსური რეკომენდაციები
              </h3>

              {insights.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {insights.map((ins) => (
                    <div 
                      key={ins.id} 
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        background: ins.type === 'danger' ? 'rgba(239, 68, 68, 0.05)' : ins.type === 'warning' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(139, 92, 246, 0.05)',
                        border: '1px solid ' + (ins.type === 'danger' ? 'rgba(239, 68, 68, 0.2)' : ins.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(139, 92, 246, 0.2)'),
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        lineHeight: '1.4'
                      }}
                    >
                      <AlertCircle size={16} style={{ 
                        color: ins.type === 'danger' ? 'hsl(var(--accent-rose))' : ins.type === 'warning' ? 'hsl(var(--accent-amber))' : 'hsl(var(--primary-hover))',
                        flexShrink: 0
                      }} />
                      <span>{ins.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                  რეკომენდაციები ჯერ არ არის
                </div>
              )}
            </GlassCard>

            {/* Category Expenses Chart */}
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>ხარჯების გადანაწილება</h3>
              <div style={{ flex: 1, minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--bg-surface-elevated))', borderColor: 'var(--border-light)', borderRadius: '8px', color: 'white' }} formatter={(val) => `${val} ₾`} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>მონაცემები არ არის</span>
                )}
              </div>
            </GlassCard>
          </section>

          {/* Budgets & Savings Goals */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {/* Category Budgets Manager */}
            <GlassCard>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>კატეგორიის ბიუჯეტები</h3>
              
              <form onSubmit={handleAddBudget} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <select 
                  className="form-select" 
                  value={newBudgetCategory} 
                  onChange={e => setNewBudgetCategory(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="ლიმიტი (₾)" 
                  value={newBudgetLimit}
                  onChange={e => setNewBudgetLimit(e.target.value)}
                  style={{ width: '100px' }}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>დამატება</button>
              </form>

              {/* Budgets list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.keys(budgets).map(cat => {
                  const limit = budgets[cat];
                  const spent = expenseByCategory[cat] || 0;
                  const pct = Math.min(100, Math.round((spent / limit) * 100));
                  const isOver = spent > limit;
                  
                  return (
                    <div key={cat} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        <span>{cat}</span>
                        <span style={{ color: isOver ? 'hsl(var(--accent-rose))' : 'hsl(var(--text-secondary))' }}>
                          {spent} ₾ / {limit} ₾
                        </span>
                      </div>
                      <ProgressBar progress={pct} type={isOver ? 'complete' : 'ongoing'} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.35rem' }}>
                        <span>{pct}% ათვისებული</span>
                        <button onClick={() => handleRemoveBudget(cat)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--accent-rose))', cursor: 'pointer' }}>
                          წაშლა
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Savings Goals Manager */}
            <GlassCard>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} style={{ color: 'hsl(var(--accent-emerald))' }} />
                დაზოგვის მიზნები
              </h3>

              <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="მიზანი (მაგ. მოგზაურობა ✈️)" 
                  value={newGoalName}
                  onChange={e => setNewGoalName(e.target.value)}
                  required 
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="სამიზნე (₾)" 
                    value={newGoalTarget}
                    onChange={e => setNewGoalTarget(e.target.value)}
                    required
                  />
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="არსებული (₾)" 
                    value={newGoalCurrent}
                    onChange={e => setNewGoalCurrent(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>მიზნის შექმნა</button>
              </form>

              {/* Goals list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {savingsGoals.map(goal => {
                  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                  return (
                    <div key={goal.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        <span>{goal.name}</span>
                        <span>{goal.current} ₾ / {goal.target} ₾</span>
                      </div>
                      <ProgressBar progress={pct} type="complete" />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.35rem' }}>
                        <span>{pct}% შევსებული</span>
                        <button onClick={() => handleRemoveGoal(goal.id)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--accent-rose))', cursor: 'pointer' }}>
                          წაშლა
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </section>

          {/* Connected Bank accounts & Live statement ledger */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Accounts details */}
            <GlassCard>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>დაკავშირებული ანგარიშები</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {accounts.map(acc => (
                  <div key={acc.id} style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{acc.name}</span>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>{acc.type}</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', color: acc.balance >= 0 ? 'white' : 'hsl(var(--accent-rose))' }}>
                      {acc.balance.toLocaleString()} ₾
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Transactions imported */}
            <GlassCard>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>იმპორტირებული ტრანზაქციები ({transactions.length})</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {transactions.map(tx => {
                  const isIncome = tx.type === 'income';
                  return (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tx.note}</div>
                        <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>{tx.date} | {tx.category}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isIncome ? 'hsl(var(--accent-emerald))' : 'hsl(var(--accent-rose))' }}>
                        {isIncome ? '+' : '-'}{tx.amount} ₾
                      </span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </section>
        </div>
      )}

      {/* Mock Plaid Link Modal */}
      {showPlaidModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'hsl(var(--bg-surface-elevated))',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            width: '100%', maxWidth: '400px',
            padding: '2rem',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <ShieldCheck size={24} style={{ color: 'hsl(var(--accent-emerald))' }} />
              <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>Connect Bank via Plaid</span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              დააკავშირეთ თქვენი საბანკო ანგარიში უსაფრთხოდ. ჩვენ არასდროს ვინახავთ პაროლებს.
            </p>

            <form onSubmit={handlePlaidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">აირჩიეთ ბანკი</label>
                <select 
                  className="form-select" 
                  value={selectedBank} 
                  onChange={e => setSelectedBank(e.target.value)}
                  required
                >
                  <option value="">-- აირჩიეთ --</option>
                  <option value="TBC Bank">თიბისი ბანკი (TBC Bank)</option>
                  <option value="Bank of Georgia">საქართველოს ბანკი (BOG)</option>
                  <option value="Liberty Bank">ლიბერთი ბანკი (Liberty)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">მომხმარებელი (Username)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Username / Email" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">პაროლი (Password)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPlaidModal(false)} 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  Connect Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
