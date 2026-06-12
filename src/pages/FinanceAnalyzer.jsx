import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { financeService } from '../services/financeProviders';
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

export const FinanceAnalyzer = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
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
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');

  const expenseCategories = [
    'საჭმელი', 'ქირა', 'კომუნალური', 'ტრანსპორტი', 'გართობა', 'შოპინგი', 'სზვა ხარჯი'
  ];

  const translateFinanceCategory = (cat) => {
    if (!cat) return '';
    if (language === 'ka') return cat;
    if (cat.includes('ხელფასი')) return 'Salary';
    if (cat.includes('ბიზნესი')) return 'Business';
    if (cat.includes('ბონუსი')) return 'Bonus';
    if (cat.includes('ფრილანსერობა')) return 'Freelancing';
    if (cat.includes('ინვესტიციები')) return 'Investments';
    if (cat.includes('სხვა შემოსავალი')) return 'Other Income';
    if (cat.includes('ქირა')) return 'Rent';
    if (cat.includes('საჭმელი')) return 'Food';
    if (cat.includes('კომუნალური')) return 'Utilities';
    if (cat.includes('ინტერნეტი')) return 'Internet';
    if (cat.includes('დაზღვევა')) return 'Insurance';
    if (cat.includes('ტაქსი')) return 'Taxi';
    if (cat.includes('ტრანსპორტი')) return 'Transport';
    if (cat.includes('მანქანა')) return 'Car';
    if (cat.includes('საწვავი')) return 'Fuel';
    if (cat.includes('გართობა')) return 'Entertainment';
    if (cat.includes('კაფეები')) return 'Cafes & Restaurants';
    if (cat.includes('მოგზაურობა')) return 'Travel';
    if (cat.includes('წამლები')) return 'Medicine';
    if (cat.includes('შოპინგი')) return 'Shopping';
    if (cat.includes('სხვა ხარჯი') || cat.includes('სზვა ხარჯი')) return 'Other Expense';
    return cat;
  };

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

  const handlePlaidSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBank) {
      alert(t("გთხოვთ აირჩიოთ ბანკი.", "Please select a bank."));
      return;
    }
    setSyncing(true);
    setShowPlaidModal(false);

    try {
      const provider = financeService.getProvider(selectedBank);
      await provider.connect(selectedBank, username, password);

      const importedAccounts = await provider.getAccounts(selectedBank);
      const importedTx = await provider.getTransactions();

      const defaultBudgets = {
        'საჭმელი': 500,
        'ქირა': 1500,
        'გართობა': 300
      };

      const defaultGoals = [
        { id: 'goal-1', name: t('სამოგზაურო ფონდი ✈️', 'Travel Fund ✈️'), target: 5000, current: 2500 }
      ];

      saveFinancialData(importedAccounts, importedTx, defaultBudgets, defaultGoals);
      setSuccessMsg(t(`ბანკი ${selectedBank} წარმატებით დაუკავშირდა! მონაცემები იმპორტირებულია.`, `Bank ${selectedBank} connected successfully! Data imported.`));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to connect bank:', err);
      alert(t('ბანკთან დაკავშირება ვერ მოხერხდა: ', 'Failed to connect bank: ') + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectBank = () => {
    if (window.confirm(t("დარწმუნებული ხართ, რომ გსურთ ბანკის კავშირის გაწყვეტა და მონაცემების წაშლა?", "Are you sure you want to disconnect bank and delete data?"))) {
      saveFinancialData([], [], {}, []);
      setSuccessMsg(t("ბანკის კავშირი გაუქმდა. ყველა ტრანზაქცია წაშლილია.", "Bank disconnected. All transactions deleted."));
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleEditTransactionCategory = (txId, newCategory) => {
    const updatedTx = transactions.map(tx => {
      if (tx.id === txId) {
        return { ...tx, category: newCategory };
      }
      return tx;
    });
    saveFinancialData(accounts, updatedTx, budgets, savingsGoals);
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
    name: translateFinanceCategory(cat),
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
        text: t(`კვების ხარჯები ამ თვეში გაიზარდა 23%-ით. მიზანშეწონილია ბიუჯეტის კონტროლი.`, `Food expenses increased by 23% this month. Budget control is recommended.`),
        type: 'warning'
      });
    }

    // Savings insights
    if (totalIncome > 0) {
      const savings = totalIncome - totalExpenses;
      if (savings > 500) {
        insightsList.push({
          id: 'ins-2',
          text: t(`თქვენ შეგიძლიათ დაზოგოთ დაახლოებით 150 ₾ თვეში გამოუყენებელი სერვისების ან გამოწერების შემცირებით.`, `You can save around 150 ₾ per month by reducing unused services or subscriptions.`),
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
          text: t(`გაფრთხილება: თქვენ გადააჭარბეთ '${cat}' კატეგორიის ბიუჯეტს ${spent - limit} ₾-ით.`, `Warning: You exceeded '${translateFinanceCategory(cat)}' budget by ${spent - limit} ₾.`),
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
          <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>{t('ფინანსების ანალიზი', 'Finance Analyzer')}</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>{t('ღია ბანკინგის მხარდაჭერა, ავტომატური რეპორტინგი და AI ფინანსური ინსაითები', 'Open banking support, automated reporting and AI financial insights')}</p>
        </div>

        {accounts.length > 0 ? (
          <button onClick={handleDisconnectBank} className="btn btn-danger">
            <Trash2 size={16} />
            <span>{t('ბანკის გათიშვა', 'Disconnect Bank')}</span>
          </button>
        ) : (
          <button onClick={handleConnectBank} disabled={syncing} className="btn btn-primary">
            <Building2 size={16} />
            <span>{syncing ? t('მიმდინარეობს დაკავშირება...', 'Connecting...') : t('ბანკის დაკავშირება', 'Connect Bank')}</span>
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
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{t('ფინანსური ანალიზატორი გათიშულია', 'Financial Analyzer Disconnected')}</h3>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', maxWidth: '450px', lineHeight: '1.5' }}>
            {t("დააკავშირეთ თქვენი საბანკო ანგარიში, რათა ავტომატურად მოხდეს ტრანზაქციების იმპორტირება, კატეგორიზაცია და ფინანსური ჯანმრთელობის ანალიზი.", "Connect your bank account to automatically import, categorize, and analyze your financial health.")}
          </p>
          <button onClick={handleConnectBank} className="btn btn-primary">
            {t('დააკავშირეთ ბანკი ახლავე (Mock Integration)', 'Connect Bank Now (Mock Integration)')}
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
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>{t('საერთო ბალანსი', 'Net Balance')}</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{currentBalance.toLocaleString()} ₾</h3>
              </div>
            </GlassCard>

            <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'hsl(var(--accent-emerald))' }}>
                <ArrowUpRight size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>{t('შემოსავლები (თვე)', 'Income (Month)')}</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--accent-emerald))' }}>+{totalIncome.toLocaleString()} ₾</h3>
              </div>
            </GlassCard>

            <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'hsl(var(--accent-rose))' }}>
                <ArrowDownRight size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>{t('ხარჯები (თვე)', 'Expenses (Month)')}</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--accent-rose))' }}>-{totalExpenses.toLocaleString()} ₾</h3>
              </div>
            </GlassCard>

            {/* Health Score Card */}
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>{t('ფინანსური ჯანმრთელობის ინდექსი', 'Financial Health Index')}</span>
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
                {t('AI ფინანსური რეკომენდაციები', 'AI Financial Insights')}
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
                  {t('რეკომენდაციები ჯერ არ არის', 'No insights yet')}
                </div>
              )}
            </GlassCard>

            {/* Category Expenses Chart */}
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('ხარჯების გადანაწილება', 'Expense Distribution')}</h3>
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
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>{t('მონაცემები არ არის', 'No data available')}</span>
                )}
              </div>
            </GlassCard>
          </section>

          {/* Budgets & Savings Goals */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {/* Category Budgets Manager */}
            <GlassCard>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>{t('კატეგორიის ბიუჯეტები', 'Category Budgets')}</h3>
              
              <form onSubmit={handleAddBudget} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <select 
                  className="form-select" 
                  value={newBudgetCategory} 
                  onChange={e => setNewBudgetCategory(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {expenseCategories.map(cat => <option key={cat} value={cat}>{translateFinanceCategory(cat)}</option>)}
                </select>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder={t("ლიმიტი (₾)", "Limit (₾)")} 
                  value={newBudgetLimit}
                  onChange={e => setNewBudgetLimit(e.target.value)}
                  style={{ width: '100px' }}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>{t('დამატება', 'Add')}</button>
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
                        <span>{translateFinanceCategory(cat)}</span>
                        <span style={{ color: isOver ? 'hsl(var(--accent-rose))' : 'hsl(var(--text-secondary))' }}>
                          {spent} ₾ / {limit} ₾
                        </span>
                      </div>
                      <ProgressBar progress={pct} type={isOver ? 'complete' : 'ongoing'} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.35rem' }}>
                        <span>{pct}% {t('ათვისებული', 'spent')}</span>
                        <button onClick={() => handleRemoveBudget(cat)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--accent-rose))', cursor: 'pointer' }}>
                          {t('წაშლა', 'Delete')}
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
                {t('დაზოგვის მიზნები', 'Savings Goals')}
              </h3>

              <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={t("მიზანი (მაგ. მოგზაურობა ✈️)", "Goal (e.g. Travel ✈️)")} 
                  value={newGoalName}
                  onChange={e => setNewGoalName(e.target.value)}
                  required 
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder={t("სამიზნე (₾)", "Target (₾)")} 
                    value={newGoalTarget}
                    onChange={e => setNewGoalTarget(e.target.value)}
                    required
                  />
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder={t("არსებული (₾)", "Current (₾)")} 
                    value={newGoalCurrent}
                    onChange={e => setNewGoalCurrent(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{t('მიზნის შექმნა', 'Create Goal')}</button>
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
                        <span>{pct}% {t('შევსებული', 'saved')}</span>
                        <button onClick={() => handleRemoveGoal(goal.id)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--accent-rose))', cursor: 'pointer' }}>
                          {t('წაშლა', 'Delete')}
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>{t('დაკავშირებული ანგარიშები', 'Connected Accounts')}</h3>
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>{t('იმპორტირებული ტრანზაქციები', 'Imported Transactions')} ({transactions.length})</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {transactions.map(tx => {
                  const isIncome = tx.type === 'income';
                  return (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{translateFinanceCategory(tx.note)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>{tx.date}</span>
                          <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>|</span>
                          
                          {/* Category Selector Dropdown */}
                          <select
                            value={tx.category}
                            onChange={(e) => handleEditTransactionCategory(tx.id, e.target.value)}
                            style={{
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '4px',
                              color: 'hsl(var(--text-secondary))',
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.25rem',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            {tx.type === 'income' ? (
                              <>
                                <option value="ხელფასი">{translateFinanceCategory('ხელფასი')}</option>
                                <option value="ბიზნესი">{translateFinanceCategory('ბიზნესი')}</option>
                                <option value="ბონუსი">{translateFinanceCategory('ბონუსი')}</option>
                                <option value="ფრილანსერობა">{translateFinanceCategory('ფრილანსერობა')}</option>
                                <option value="ინვესტიციები">{translateFinanceCategory('ინვესტიციები')}</option>
                                <option value="სხვა შემოსავალი">{translateFinanceCategory('სხვა შემოსავალი')}</option>
                              </>
                            ) : (
                              <>
                                <option value="საჭმელი">{translateFinanceCategory('საჭმელი')}</option>
                                <option value="ქირა">{translateFinanceCategory('ქირა')}</option>
                                <option value="კომუნალური">{translateFinanceCategory('კომუნალური')}</option>
                                <option value="ტრანსპორტი">{translateFinanceCategory('ტრანსპორტი')}</option>
                                <option value="გართობა">{translateFinanceCategory('გართობა')}</option>
                                <option value="შოპინგი">{translateFinanceCategory('შოპინგი')}</option>
                                <option value="სხვა ხარჯი">{translateFinanceCategory('სხვა ხარჯი')}</option>
                                <option value="სზვა ხარჯი">{translateFinanceCategory('სზვა ხარჯი')}</option>
                              </>
                            )}
                          </select>
                        </div>
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
              {t('დააკავშირეთ თქვენი საბანკო ანგარიში უსაფრთხოდ. ჩვენ არასდროს ვინახავთ პაროლებს.', 'Connect your bank account securely. We never store your password.')}
            </p>

            <form onSubmit={handlePlaidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('აირჩიეთ ბანკი', 'Select Bank')}</label>
                <select 
                  className="form-select" 
                  value={selectedBank} 
                  onChange={e => setSelectedBank(e.target.value)}
                  required
                >
                  <option value="">{t('-- აირჩიეთ --', '-- Select Bank --')}</option>
                  <option value="TBC Bank">{t('თიბისი ბანკი (TBC Bank)', 'TBC Bank')}</option>
                  <option value="Bank of Georgia">{t('საქართველოს ბანკი (BOG)', 'Bank of Georgia (BOG)')}</option>
                  <option value="Liberty Bank">{t('ლიბერთი ბანკი (Liberty)', 'Liberty Bank (Liberty)')}</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('მომხმარებელი (Username)', 'Username')}</label>
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
                <label className="form-label">{t('პაროლი (Password)', 'Password')}</label>
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
