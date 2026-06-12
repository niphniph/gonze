import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, DollarSign, Wallet, Calendar, Tag } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { db } from '../utils/db';
import { GlassCard } from '../components/GlassCard';

export const Finance = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [transactions, setTransactions] = useState([]);
  
  // Form state
  const [type, setType] = useState('expense'); // 'income' or 'expense'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('2026-06-07');
  const [note, setNote] = useState('');

  const incomeCategories = ['ხელფასი', 'ბიზნესი', 'ბონუსი', 'ფრილანსერობა', 'ინვესტიციები', 'სხვა შემოსავალი'];
  const expenseCategories = [
    'ქირა', 'საჭმელი', 'კომუნალური', 'ინტერნეტი', 'დაზღვევა', 
    'ტაქსი', 'ტრანსპორტი', 'მანქანა', 'საწვავი', 'გართობა', 
    'კაფეები და რესტორნები', 'მოგზაურობა', 'წამლები', 'შოპინგი', 'სხვა ხარჯი'
  ];

  const translateFinanceCategory = (cat) => {
    if (!cat) return '';
    if (language === 'ka') return cat;
    // Income
    if (cat === 'ხელფასი') return 'Salary';
    if (cat === 'ბიზნესი') return 'Business';
    if (cat === 'ბონუსი') return 'Bonus';
    if (cat === 'ფრილანსერობა') return 'Freelancing';
    if (cat === 'ინვესტიციები') return 'Investments';
    if (cat === 'სხვა შემოსავალი') return 'Other Income';
    // Expense
    if (cat === 'ქირა') return 'Rent';
    if (cat === 'საჭმელი') return 'Food';
    if (cat === 'კომუნალური') return 'Utilities';
    if (cat === 'ინტერნეტი') return 'Internet';
    if (cat === 'დაზღვევა') return 'Insurance';
    if (cat === 'ტაქსი') return 'Taxi';
    if (cat === 'ტრანსპორტი') return 'Transport';
    if (cat === 'მანქანა') return 'Car';
    if (cat === 'საწვავი') return 'Fuel';
    if (cat === 'გართობა') return 'Entertainment';
    if (cat === 'კაფეები და რესტორნები') return 'Cafes & Restaurants';
    if (cat === 'მოგზაურობა') return 'Travel';
    if (cat === 'წამლები') return 'Medicine';
    if (cat === 'შოპინგი') return 'Shopping';
    if (cat === 'სხვა ხარჯი') return 'Other Expense';
    return cat;
  };

  // Set default category depending on type
  useEffect(() => {
    setCategory(type === 'income' ? incomeCategories[0] : expenseCategories[0]);
  }, [type]);

  // Load finance transactions
  useEffect(() => {
    setTransactions(db.getFinance() || []);
  }, []);

  const updateFinanceState = (newTx) => {
    setTransactions(newTx);
    db.saveFinance(newTx);
  };

  // Add transaction
  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const newTx = {
      id: `f-${Date.now()}`,
      type,
      amount: Number(amount),
      category,
      date,
      note: note.trim() || category
    };

    updateFinanceState([newTx, ...transactions]);
    setAmount('');
    setNote('');
  };

  // Delete transaction
  const handleDeleteTransaction = (id) => {
    if (window.confirm(t("დარწმუნებული ხართ, რომ გსურთ ტრანზაქციის წაშლა?", "Are you sure you want to delete this transaction?"))) {
      const updated = transactions.filter(t => t.id !== id);
      updateFinanceState(updated);
    }
  };

  // Calculations
  const incomeTx = transactions.filter(t => t.type === 'income');
  const expenseTx = transactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTx.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = expenseTx.reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  // Group expense data by category for PieChart
  const expenseByCategory = {};
  expenseTx.forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Number(t.amount);
  });
  
  const pieChartData = Object.keys(expenseByCategory).map(cat => ({
    name: translateFinanceCategory(cat),
    value: expenseByCategory[cat]
  }));

  const COLORS = [
    'hsl(var(--primary))', 
    'hsl(var(--accent-blue))', 
    'hsl(var(--accent-emerald))', 
    'hsl(var(--accent-amber))', 
    'hsl(var(--accent-rose))',
    '#c084fc',
    '#38bdf8',
    '#34d399',
    '#fbbf24'
  ];

  return (
    <div className="finance-page">
      <header className="page-header" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>{t('ფინანსები', 'Finance Ledger')}</h1>
        <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>{t('მართეთ შემოსავლები და ხარჯები მარტივად', 'Easily manage income and expenses')}</p>
      </header>

      {/* Stats Summary cards */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2.5rem' 
      }}>
        {/* Net Balance */}
        <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'hsl(var(--primary-glow))', color: 'hsl(var(--primary-hover))' }}>
            <Wallet size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{t('საერთო ბალანსი', 'Net Balance')}</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: netBalance >= 0 ? 'hsl(var(--accent-emerald))' : 'hsl(var(--accent-rose))' }}>
              {netBalance.toLocaleString()} ₾
            </h3>
          </div>
        </GlassCard>

        {/* Income */}
        <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'hsl(var(--accent-emerald))' }}>
            <ArrowUpRight size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{t('სულ შემოსავალი', 'Total Income')}</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
              +{totalIncome.toLocaleString()} ₾
            </h3>
          </div>
        </GlassCard>

        {/* Expenses */}
        <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'hsl(var(--accent-rose))' }}>
            <ArrowDownRight size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{t('სულ ხარჯი', 'Total Expense')}</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
              -{totalExpense.toLocaleString()} ₾
            </h3>
          </div>
        </GlassCard>
      </section>

      {/* Forms & Charts section */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Ledger entry form */}
        <GlassCard>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('ტრანზაქციის დამატება', 'Add Transaction')}</h3>
          
          <form onSubmit={handleAddTransaction}>
            {/* Type tabs toggle */}
            <div style={{ 
              display: 'flex', 
              background: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '10px', 
              padding: '0.25rem', 
              marginBottom: '1.5rem',
              border: '1px solid var(--border-light)' 
            }}>
              <button 
                type="button" 
                onClick={() => setType('expense')}
                style={{ 
                  flex: 1, 
                  padding: '0.5rem', 
                  borderRadius: '8px', 
                  background: type === 'expense' ? 'hsl(var(--accent-rose) / 0.15)' : 'transparent',
                  color: type === 'expense' ? 'hsl(var(--accent-rose))' : 'hsl(var(--text-secondary))',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t('ხარჯი', 'Expense')}
              </button>
              <button 
                type="button" 
                onClick={() => setType('income')}
                style={{ 
                  flex: 1, 
                  padding: '0.5rem', 
                  borderRadius: '8px', 
                  background: type === 'income' ? 'hsl(var(--accent-emerald) / 0.15)' : 'transparent',
                  color: type === 'income' ? 'hsl(var(--accent-emerald))' : 'hsl(var(--text-secondary))',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t('შემოსავალი', 'Income')}
              </button>
            </div>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('თანხა (₾)', 'Amount (₾)')}</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="0.00" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('კატეგორია', 'Category')}</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {type === 'income' 
                    ? incomeCategories.map(cat => <option key={cat} value={cat}>{translateFinanceCategory(cat)}</option>)
                    : expenseCategories.map(cat => <option key={cat} value={cat}>{translateFinanceCategory(cat)}</option>)
                  }
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('თარიღი', 'Date')}</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('კომენტარი', 'Comment')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={t("შენიშვნა...", "Note...")} 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem', background: type === 'income' ? 'hsl(var(--accent-emerald))' : 'hsl(var(--primary))' }}
            >
              <Plus size={16} />
              <span>{t('ტრანზაქციის დამატება', 'Add Transaction')}</span>
            </button>
          </form>
        </GlassCard>

        {/* Expense Category Chart */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('ხარჯების ანალიზი', 'Expense Analysis')}</h3>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
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
              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                {t('არ არის ხარჯების მონაცემები', 'No expense data available')}
              </div>
            )}
          </div>
        </GlassCard>
      </section>

      {/* Ledger list */}
      <section>
        <GlassCard style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>{t('ტრანზაქციების ისტორია', 'Transactions History')} ({transactions.length})</h3>
          
          {transactions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {transactions.map(tx => {
                const isIncome = tx.type === 'income';
                return (
                  <div 
                    key={tx.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '10px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Icon indicator */}
                      <div style={{ 
                        padding: '0.4rem', 
                        borderRadius: '8px', 
                        background: isIncome ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isIncome ? 'hsl(var(--accent-emerald))' : 'hsl(var(--accent-rose))'
                      }}>
                        {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{translateFinanceCategory(tx.note)}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                            <Tag size={10} />
                            {translateFinanceCategory(tx.category)}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                            <Calendar size={10} />
                            {tx.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '1rem', 
                        color: isIncome ? 'hsl(var(--accent-emerald))' : 'hsl(var(--accent-rose))' 
                      }}>
                        {isIncome ? '+' : '-'}{tx.amount.toLocaleString()} ₾
                      </span>
                      <button 
                        onClick={() => handleDeleteTransaction(tx.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--accent-rose))', padding: '0.2rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
              {t('ტრანზაქციები ვერ მოიძებნა.', 'No transactions found.')}
            </div>
          )}
        </GlassCard>
      </section>
    </div>
  );
};
