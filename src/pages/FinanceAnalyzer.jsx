import { useState } from 'react';
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
  Legend
} from 'recharts';
import { 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Sparkles,
  ShieldCheck,
  Target
} from 'lucide-react';

export const FinanceAnalyzer = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [accounts, setAccounts] = useState(() => db.getFinancialAccounts() || []);
  const [transactions, setTransactions] = useState(() => db.getTransactions() || []);
  const [budgets, setBudgets] = useState(() => db.getBudgets() || {});
  const [savingsGoals, setSavingsGoals] = useState(() => db.getSavingsGoals() || []);
  
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
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-7xl mx-auto space-y-stack-lg pb-32">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-md text-2xl font-black text-primary-fixed-dim">{t('ფინანსების ანალიზი', 'Finance Analyzer')}</h2>
          <p className="font-body-md text-on-surface-variant">{t('ღია ბანკინგის მხარდაჭერა, ავტომატური რეპორტინგი და AI ფინანსური ინსაითები', 'Open banking support, automated reporting and AI financial insights')}</p>
        </div>

        {accounts.length > 0 ? (
          <button onClick={handleDisconnectBank} className="bg-error/10 hover:bg-error/20 text-error border border-error/20 font-bold text-xs py-2.5 px-5 rounded-full cursor-pointer transition-all active:scale-95 flex items-center gap-2">
            <Trash2 size={16} />
            <span>{t('ბანკის გათიშვა', 'Disconnect Bank')}</span>
          </button>
        ) : (
          <button onClick={handleConnectBank} disabled={syncing} className="bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-bold text-xs py-2.5 px-5 rounded-full cursor-pointer transition-all active:scale-95 flex items-center gap-2 border-none">
            <Building2 size={16} />
            <span>{syncing ? t('მიმდინარეობს დაკავშირება...', 'Connecting...') : t('ბანკის დაკავშირება', 'Connect Bank')}</span>
          </button>
        )}
      </header>

      {successMsg && (
        <div className="bg-green-400/10 border border-green-400/20 text-green-400 p-4 rounded-xl flex items-center gap-3 font-semibold">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 md:p-24 bg-surface-container-low/30 border border-outline-variant/10 rounded-2xl gap-5">
          <div className="w-16 h-16 rounded-full bg-primary-fixed/10 flex items-center justify-center text-primary-fixed-dim">
            <Wallet size={36} />
          </div>
          <h3 className="font-headline-md text-xl font-bold text-on-surface">{t('ფინანსური ანალიზატორი გათიშულია', 'Financial Analyzer Disconnected')}</h3>
          <p className="font-body-md text-xs text-on-surface-variant max-w-md leading-relaxed">
            {t("დააკავშირეთ თქვენი საბანკო ანგარიში, რათა ავტომატურად მოხდეს ტრანზაქციების იმპორტირება, კატეგორიზაცია და ფინანსური ჯანმრთელობის ანალიზი.", "Connect your bank account to automatically import, categorize, and analyze your financial health.")}
          </p>
          <button onClick={handleConnectBank} className="bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-bold text-xs py-3.5 px-6 rounded-full cursor-pointer transition-all border-none active:scale-95 mt-2">
            {t('დააკავშირეთ ბანკი ახლავე (Mock Integration)', 'Connect Bank Now (Mock Integration)')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary-fixed/10 text-primary-fixed-dim">
                <Wallet size={24} />
              </div>
              <div>
                <span className="font-body-md text-xs text-on-surface-variant block">{t('საერთო ბალანსი', 'Net Balance')}</span>
                <h3 className="font-headline-md text-lg font-bold text-on-surface mt-0.5">{currentBalance.toLocaleString()} ₾</h3>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-400/10 text-green-400">
                <ArrowUpRight size={24} />
              </div>
              <div>
                <span className="font-body-md text-xs text-on-surface-variant block">{t('შემოსავლები (თვე)', 'Income (Month)')}</span>
                <h3 className="font-headline-md text-lg font-bold text-green-400 mt-0.5">+{totalIncome.toLocaleString()} ₾</h3>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-error/10 text-error">
                <ArrowDownRight size={24} />
              </div>
              <div>
                <span className="font-body-md text-xs text-on-surface-variant block">{t('ხარჯები (თვე)', 'Expenses (Month)')}</span>
                <h3 className="font-headline-md text-lg font-bold text-error mt-0.5">-{totalExpenses.toLocaleString()} ₾</h3>
              </div>
            </div>

            {/* Health Score Card */}
            <div className="glass-card rounded-xl p-5 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="font-body-md text-xs text-on-surface-variant">{t('ფინანსური ჯანმრთელობის ინდექსი', 'Financial Health Index')}</span>
                <Sparkles size={16} className="text-primary-fixed-dim" />
              </div>
              <h3 className={`font-headline-md text-lg font-bold mt-0.5 ${healthScore > 75 ? 'text-green-400' : 'text-orange-400'}`}>
                {healthScore} / 100
              </h3>
              <ProgressBar progress={healthScore} type={healthScore > 75 ? 'complete' : 'ongoing'} showPercent={false} />
            </div>
          </div>

          {/* AI Insights & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Insights list */}
            <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col gap-5">
              <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                <Sparkles size={18} className="text-primary-fixed-dim" />
                {t('AI ფინანსური რეკომენდაციები', 'AI Financial Insights')}
              </h3>

              {insights.length > 0 ? (
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[250px] pr-1 custom-scrollbar">
                  {insights.map((ins) => (
                    <div 
                      key={ins.id} 
                      className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 leading-relaxed ${
                        ins.type === 'danger' ? 'bg-red-400/5 border-red-400/10 text-red-400' : ins.type === 'warning' ? 'bg-orange-400/5 border-orange-400/10 text-orange-400' : 'bg-primary-fixed/5 border-primary-fixed/10 text-primary-fixed-dim'
                      }`}
                    >
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{ins.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/50 text-xs py-8 border border-dashed border-outline-variant/10 rounded-xl">
                  {t('რეკომენდაციები ჯერ არ არის', 'No insights yet')}
                </div>
              )}
            </div>

            {/* Category Expenses Chart */}
            <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col gap-5">
              <h3 className="font-headline-md text-base font-bold text-on-surface">{t('ხარჯების გადანაწილება', 'Expense Distribution')}</h3>
              <div className="flex-1 min-h-[220px] flex items-center justify-center">
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-container-high)', borderColor: 'var(--color-outline-variant)', borderRadius: '8px', color: 'white' }} formatter={(val) => `${val} ₾`} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-on-surface-variant/50 text-xs">{t('მონაცემები არ არის', 'No data available')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Budgets & Savings Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Budgets Manager */}
            <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col gap-5">
              <h3 className="font-headline-md text-base font-bold text-on-surface">{t('კატეგორიის ბიუჯეტები', 'Category Budgets')}</h3>
              
              <form onSubmit={handleAddBudget} className="flex gap-2">
                <select 
                  className="flex-1 bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors cursor-pointer"
                  value={newBudgetCategory} 
                  onChange={e => setNewBudgetCategory(e.target.value)}
                >
                  {expenseCategories.map(cat => <option key={cat} value={cat}>{translateFinanceCategory(cat)}</option>)}
                </select>
                <input 
                  type="number" 
                  className="w-28 bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors" 
                  placeholder={t("ლიმიტი (₾)", "Limit (₾)")} 
                  value={newBudgetLimit}
                  onChange={e => setNewBudgetLimit(e.target.value)}
                  required
                />
                <button type="submit" className="bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer border-none transition-all active:scale-95">{t('დამატება', 'Add')}</button>
              </form>

              {/* Budgets list */}
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                {Object.keys(budgets).map(cat => {
                  const limit = budgets[cat];
                  const spent = expenseByCategory[cat] || 0;
                  const pct = Math.min(100, Math.round((spent / limit) * 100));
                  const isOver = spent > limit;
                  
                  return (
                    <div key={cat} className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4">
                      <div className="flex justify-between items-center text-xs font-semibold mb-2">
                        <span className="text-on-surface">{translateFinanceCategory(cat)}</span>
                        <span className={isOver ? 'text-error' : 'text-on-surface-variant'}>
                          {spent} ₾ / {limit} ₾
                        </span>
                      </div>
                      <ProgressBar progress={pct} type={isOver ? 'complete' : 'ongoing'} showPercent={false} />
                      <div className="flex justify-between items-center text-[10px] text-on-surface-variant/70 mt-2">
                        <span>{pct}% {t('ათვისებული', 'spent')}</span>
                        <button onClick={() => handleRemoveBudget(cat)} className="text-error hover:underline cursor-pointer bg-transparent border-none p-0 text-[10px]">
                          {t('წაშლა', 'Delete')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Savings Goals Manager */}
            <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col gap-5">
              <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                <Target size={18} className="text-green-400" />
                {t('დაზოგვის მიზნები', 'Savings Goals')}
              </h3>

              <form onSubmit={handleAddGoal} className="flex flex-col gap-3">
                <input 
                  type="text" 
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors" 
                  placeholder={t("მიზანი (მაგ. მოგზაურობა ✈️)", "Goal (e.g. Travel ✈️)")} 
                  value={newGoalName}
                  onChange={e => setNewGoalName(e.target.value)}
                  required 
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" 
                    className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors" 
                    placeholder={t("სამიზნე (₾)", "Target (₾)")} 
                    value={newGoalTarget}
                    onChange={e => setNewGoalTarget(e.target.value)}
                    required
                  />
                  <input 
                    type="number" 
                    className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors" 
                    placeholder={t("არსებული (₾)", "Current (₾)")} 
                    value={newGoalCurrent}
                    onChange={e => setNewGoalCurrent(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer border-none transition-all active:scale-95">{t('მიზნის შექმნა', 'Create Goal')}</button>
              </form>

              {/* Goals list */}
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[250px] pr-1 custom-scrollbar">
                {savingsGoals.map(goal => {
                  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                  return (
                    <div key={goal.id} className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4">
                      <div className="flex justify-between items-center text-xs font-semibold mb-2">
                        <span className="text-on-surface">{goal.name}</span>
                        <span className="text-on-surface-variant">{goal.current} ₾ / {goal.target} ₾</span>
                      </div>
                      <ProgressBar progress={pct} type="complete" showPercent={false} />
                      <div className="flex justify-between items-center text-[10px] text-on-surface-variant/70 mt-2">
                        <span>{pct}% {t('შევსებული', 'saved')}</span>
                        <button onClick={() => handleRemoveGoal(goal.id)} className="text-error hover:underline cursor-pointer bg-transparent border-none p-0 text-[10px]">
                          {t('წაშლა', 'Delete')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Connected Bank accounts & Live statement ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Accounts details */}
            <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col gap-4">
              <h3 className="font-headline-md text-base font-bold text-on-surface">{t('დაკავშირებული ანგარიშები', 'Connected Accounts')}</h3>
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                {accounts.map(acc => (
                  <div key={acc.id} className="p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl">
                    <div className="flex justify-between items-center text-xs font-bold text-on-surface">
                      <span>{acc.name}</span>
                      <span className="font-label text-[9px] text-on-surface-variant uppercase tracking-wider">{acc.type}</span>
                    </div>
                    <div className={`text-xl font-bold mt-2 ${acc.balance >= 0 ? 'text-on-surface' : 'text-error'}`}>
                      {acc.balance.toLocaleString()} ₾
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions imported */}
            <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col gap-4 lg:col-span-2">
              <h3 className="font-headline-md text-base font-bold text-on-surface">{t('იმპორტირებული ტრანზაქციები', 'Imported Transactions')} ({transactions.length})</h3>
              
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
                {transactions.map(tx => {
                  const isIncome = tx.type === 'income';
                  return (
                    <div key={tx.id} className="flex justify-between items-center p-3.5 bg-surface-container-low border border-outline-variant/10 rounded-xl hover:border-primary-fixed-dim/20 transition-all gap-4">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="font-headline-md text-xs font-bold text-on-surface truncate">{translateFinanceCategory(tx.note)}</div>
                        <div className="flex items-center gap-2 font-label text-[10px] text-on-surface-variant/70">
                          <span>{tx.date}</span>
                          <span>|</span>
                          
                          {/* Category Selector Dropdown */}
                          <select
                            value={tx.category}
                            onChange={(e) => handleEditTransactionCategory(tx.id, e.target.value)}
                            className="bg-surface-container-highest border border-outline-variant/30 rounded px-1.5 py-0.5 text-[10px] text-on-surface-variant focus:outline-none cursor-pointer"
                          >
                            {tx.type === 'income' ? (
                              <>
                                <option value="ხელფასი" className="bg-surface-container-high">{translateFinanceCategory('ხელფასი')}</option>
                                <option value="ბიზნესი" className="bg-surface-container-high">{translateFinanceCategory('ბიზნესი')}</option>
                                <option value="ბონუსი" className="bg-surface-container-high">{translateFinanceCategory('ბონუსი')}</option>
                                <option value="ფრილანსერობა" className="bg-surface-container-high">{translateFinanceCategory('ფრილანსერობა')}</option>
                                <option value="ინვესტიციები" className="bg-surface-container-high">{translateFinanceCategory('ინვესტიციები')}</option>
                                <option value="სხვა შემოსავალი" className="bg-surface-container-high">{translateFinanceCategory('სხვა შემოსავალი')}</option>
                              </>
                            ) : (
                              <>
                                <option value="საჭმელი" className="bg-surface-container-high">{translateFinanceCategory('საჭმელი')}</option>
                                <option value="ქირა" className="bg-surface-container-high">{translateFinanceCategory('ქირა')}</option>
                                <option value="კომუნალური" className="bg-surface-container-high">{translateFinanceCategory('კომუნალური')}</option>
                                <option value="ტრანსპორტი" className="bg-surface-container-high">{translateFinanceCategory('ტრანსპორტი')}</option>
                                <option value="გართობა" className="bg-surface-container-high">{translateFinanceCategory('გართობა')}</option>
                                <option value="შოპინგი" className="bg-surface-container-high">{translateFinanceCategory('შოპინგი')}</option>
                                <option value="სხვა ხარჯი" className="bg-surface-container-high">{translateFinanceCategory('სხვა ხარჯი')}</option>
                                <option value="სზვა ხარჯი" className="bg-surface-container-high">{translateFinanceCategory('სზვა ხარჯი')}</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                      <span className={`font-headline-md text-sm font-black flex-shrink-0 ${isIncome ? 'text-green-400' : 'text-error'}`}>
                        {isIncome ? '+' : '-'}{tx.amount} ₾
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mock Plaid Link Modal */}
      {showPlaidModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-sm w-full p-8 flex flex-col gap-6 border border-outline-variant/20 shadow-2xl">
            <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/10">
              <ShieldCheck size={22} className="text-green-400" />
              <span className="font-headline-md text-base font-bold text-on-surface">Connect Bank via Plaid</span>
            </div>

            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              {t('დააკავშირეთ თქვენი საბანკო ანგარიში უსაფრთხოდ. ჩვენ არასდროს ვინახავთ პაროლებს.', 'Connect your bank account securely. We never store your password.')}
            </p>

            <form onSubmit={handlePlaidSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('აირჩიეთ ბანკი', 'Select Bank')}</label>
                <select 
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors cursor-pointer" 
                  value={selectedBank} 
                  onChange={e => setSelectedBank(e.target.value)}
                  required
                >
                  <option value="" className="bg-surface-container-high">{t('-- აირჩიეთ --', '-- Select Bank --')}</option>
                  <option value="TBC Bank" className="bg-surface-container-high">{t('თიბისი ბანკი (TBC Bank)', 'TBC Bank')}</option>
                  <option value="Bank of Georgia" className="bg-surface-container-high">{t('საქართველოს ბანკი (BOG)', 'Bank of Georgia (BOG)')}</option>
                  <option value="Liberty Bank" className="bg-surface-container-high">{t('ლიბერთი ბანკი (Liberty)', 'Liberty Bank (Liberty)')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('მომხმარებელი (Username)', 'Username')}</label>
                <input 
                  type="text" 
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors" 
                  placeholder="Username / Email" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('პაროლი (Password)', 'Password')}</label>
                <input 
                  type="password" 
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowPlaidModal(false)} 
                  className="flex-1 bg-surface-container-highest hover:bg-surface-bright text-on-surface font-semibold text-xs py-3 px-4 rounded-full cursor-pointer transition-all border border-outline-variant/30 active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-semibold text-xs py-3 px-4 rounded-full cursor-pointer transition-all border-none active:scale-95"
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
