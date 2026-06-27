import { useState } from 'react';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { db } from '../utils/db';

const generateFinanceTxId = () => `f-${Date.now()}`;

const incomeCategories = ['ხელფასი', 'ბიზნესი', 'ბონუსი', 'ფრილანსერობა', 'ინვესტიციები', 'სხვა შემოსავალი'];
const expenseCategories = ['ქირა', 'საჭმელი', 'კომუნალური', 'ინტერნეტი', 'დაზღვევა', 'ტაქსი', 'ტრანსპორტი', 'მანქანა', 'საწვავი', 'გართობა', 'კაფეები', 'მოგზაურობა', 'წამლები', 'შოპინგი', 'სხვა ხარჯი'];

export const Finance = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [transactions, setTransactions] = useState(() => db.getFinance() || []);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(expenseCategories[0]);
  const [date, setDate] = useState('2026-06-07');
  const [note, setNote] = useState('');

  const translateFinanceCategory = (cat) => {
    if (language === 'ka' || !cat) return cat;
    const map = {
      'ხელფასი': 'Salary', 'ბიზნესი': 'Business', 'ბონუსი': 'Bonus', 'ფრილანსერობა': 'Freelancing',
      'ინვესტიციები': 'Investments', 'სხვა შემოსავალი': 'Other Income', 'ქირა': 'Rent', 'საჭმელი': 'Food',
      'კომუნალური': 'Utilities', 'ინტერნეტი': 'Internet', 'დაზღვევა': 'Insurance', 'ტაქსი': 'Taxi',
      'ტრანსპორტი': 'Transport', 'მანქანა': 'Car', 'საწვავი': 'Fuel', 'გართობა': 'Entertainment',
      'კაფეები': 'Cafes', 'მოგზაურობა': 'Travel', 'წამლები': 'Medicine', 'შოპინგი': 'Shopping', 'სხვა ხარჯი': 'Other Expense'
    };
    return map[cat] || cat;
  };

  const updateFinanceState = (newTx) => { setTransactions(newTx); db.saveFinance(newTx); };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    const newTx = { id: generateFinanceTxId(), type, amount: Number(amount), category, date, note: note.trim() || category };
    updateFinanceState([newTx, ...transactions]);
    setAmount(''); setNote('');
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm(t("დარწმუნებული ხართ?", "Are you sure?"))) {
      updateFinanceState(transactions.filter(tx => tx.id !== id));
    }
  };

  const incomeTx = transactions.filter(tx => tx.type === 'income');
  const expenseTx = transactions.filter(tx => tx.type === 'expense');
  const totalIncome = incomeTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpense = expenseTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-7xl mx-auto space-y-stack-lg pb-32">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-md text-2xl font-black text-primary-fixed-dim">{t('ფინანსები', 'Finance')}</h2>
          <p className="font-body-md text-on-surface-variant">{t('მართეთ შემოსავლები და ხარჯები მარტივად', 'Easily manage income and expenses')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="glass-card rounded-xl p-6 md:p-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-on-surface-variant text-sm">{t('სულ შემოსავალი', 'Total Income')}</p>
            <p className="font-display text-2xl font-bold text-green-400">+{totalIncome.toLocaleString()} ₾</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6 md:p-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
            <ArrowDownRight size={24} />
          </div>
          <div>
            <p className="text-on-surface-variant text-sm">{t('სულ ხარჯი', 'Total Expense')}</p>
            <p className="font-display text-2xl font-bold text-red-400">-{totalExpense.toLocaleString()} ₾</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6 md:p-8 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${netBalance >= 0 ? 'bg-primary-fixed/10 text-primary-fixed-dim' : 'bg-red-500/10 text-red-400'}`}>
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm">{t('წმინდა ბალანსი', 'Net Balance')}</p>
            <p className={`font-display text-2xl font-bold ${netBalance >= 0 ? 'text-primary-fixed-dim' : 'text-red-400'}`}>
              {netBalance.toLocaleString()} ₾
            </p>
          </div>
        </div>
      </div>

      {/* Add Transaction */}
      <div className="glass-card rounded-xl p-6 md:p-8">
        <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6">{t('ტრანზაქციის დამატება', 'Add Transaction')}</h3>
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="flex p-1 bg-surface-container-lowest rounded-full border border-outline-variant/20 w-fit">
            <button type="button" onClick={() => { setType('expense'); setCategory(expenseCategories[0]); }} className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer border-none ${type === 'expense' ? 'bg-error/20 text-error' : 'text-on-surface-variant hover:text-on-surface'}`}>{t('ხარჯი', 'Expense')}</button>
            <button type="button" onClick={() => { setType('income'); setCategory(incomeCategories[0]); }} className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer border-none ${type === 'income' ? 'bg-green-500/20 text-green-400' : 'text-on-surface-variant hover:text-on-surface'}`}>{t('შემოსავალი', 'Income')}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('თანხა (₾)', 'Amount (₾)')}</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim" required />
            </div>
            <div>
              <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('კატეგორია', 'Category')}</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                {(type === 'income' ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{translateFinanceCategory(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('თარიღი', 'Date')}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('შენიშვნა', 'Note')}</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder={t("შენიშვნა...", "Note...")} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <button type="submit" className="w-full bg-primary-fixed-dim text-on-primary-fixed py-3 rounded-full font-bold text-sm hover:bg-primary-container transition-all active:scale-95 cursor-pointer border-none flex items-center justify-center gap-2 shadow-lg shadow-primary-fixed-dim/20">
            <Plus size={16} />
            {t('ტრანზაქციის დამატება', 'Add Transaction')}
          </button>
        </form>
      </div>

      {/* Transaction History */}
      <div className="glass-card rounded-xl p-6 md:p-8">
        <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6">{t('ტრანზაქციების ისტორია', 'Transactions History')} ({transactions.length})</h3>
        <div className="space-y-3">
          {transactions.length > 0 ? transactions.map(tx => {
            const isIncome = tx.type === 'income';
            return (
              <div key={tx.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/10 hover:border-primary-fixed-dim/30 transition-all">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div className="flex-1">
                  <p className="font-body-md font-bold text-on-surface">{translateFinanceCategory(tx.note || tx.category)}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="font-label text-[10px] text-on-surface-variant">{translateFinanceCategory(tx.category)}</span>
                    <span className="font-label text-[10px] text-on-surface-variant">{tx.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-display text-lg font-bold ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                    {isIncome ? '+' : '-'}{tx.amount.toLocaleString()} ₾
                  </span>
                  <button onClick={() => handleDeleteTransaction(tx.id)} className="text-on-surface-variant hover:text-error cursor-pointer bg-transparent border-none p-1"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-12 text-on-surface-variant">{t('ტრანზაქციები ვერ მოიძებნა.', 'No transactions found.')}</div>
          )}
        </div>
      </div>
    </div>
  );
};
