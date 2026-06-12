import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { GlassCard } from '../components/GlassCard';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  Clock, 
  Zap, 
  AlertTriangle,
  Award,
  CheckCircle
} from 'lucide-react';

export const Insights = () => {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});

  useEffect(() => {
    setTasks(db.getTasks() || []);
    const habitData = db.getHabits();
    setHabits(habitData.list || []);
    setTransactions(db.getTransactions() || []);
    setBudgets(db.getBudgets() || {});
  }, []);

  // Compute Productivity Statistics
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Compute Financial Statistics
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const expenseByCategory = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
  });

  // Dynamic Insights Engine
  const getProductivityInsights = () => {
    const list = [];
    
    if (tasks.length === 0) {
      list.push({
        title: "პროდუქტიულობის ინდექსი",
        text: "დაამატეთ დავალებები და ჩვევები, რათა AI-მ შეძლოს თქვენი მუშაობის ტემპის გაანალიზება.",
        type: 'info',
        icon: Clock
      });
      return list;
    }

    if (taskCompletionRate >= 75) {
      list.push({
        title: "შესანიშნავი პროდუქტიულობა!",
        text: `თქვენი დავალებების შესრულების მაჩვენებელი არის მაღალი: ${taskCompletionRate}%. გააგრძელეთ იგივე ტემპით.`,
        type: 'success',
        icon: CheckCircle
      });
    } else if (taskCompletionRate < 40) {
      list.push({
        title: "დაბალი პროდუქტიულობის მაჩვენებელი",
        text: `შესრულებულია დავალებების მხოლოდ ${taskCompletionRate}%. გირჩევთ, გაანაწილოთ დავალებები დღეებზე უფრო თანაბრად.`,
        type: 'warning',
        icon: AlertTriangle
      });
    } else {
      list.push({
        title: "სტაბილური პროგრესი",
        text: `დავალებების ${taskCompletionRate}% წარმატებით შესრულებულია. შეეცადეთ პრიორიტეტული დავალებები დღის პირველ ნახევარში გააკეთოთ.`,
        type: 'info',
        icon: Zap
      });
    }

    if (habits.length > 0) {
      list.push({
        title: "ჩვევების კონსისტენტურობა",
        text: "ყველაზე მაღალი აქტივობა ჩვევების მხრივ შეინიშნება დილის საათებში. დილის ჩვევები უფრო მყარად ყალიბდება.",
        type: 'info',
        icon: Award
      });
    }

    return list;
  };

  const getFinancialInsights = () => {
    const list = [];

    if (transactions.length === 0) {
      list.push({
        title: "ფინანსური რეპორტები",
        text: "შეაერთეთ თქვენი საბანკო ანგარიში 'ფინანსების ანალიზი' გვერდიდან ტრანზაქციების გასაანალიზებლად.",
        type: 'info',
        icon: Lightbulb
      });
      return list;
    }

    if (totalExpenses > totalIncome && totalIncome > 0) {
      list.push({
        title: "უარყოფითი ფულადი ნაკადი",
        text: `თქვენი ხარჯები აჭარბებს შემოსავლებს ${totalExpenses - totalIncome} ₾-ით. გირჩევთ, შეამციროთ არაპრიორიტეტული შოპინგის და გართობის ხარჯები.`,
        type: 'danger',
        icon: TrendingDown
      });
    } else if (totalIncome > 0) {
      const savingsRate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 100);
      list.push({
        title: "პოზიტიური ბალანსი",
        text: `თქვენ ზოგავთ შემოსავლის ${savingsRate}%-ს. ეს ძალიან კარგი მაჩვენებელია დაგროვების მიზნებისთვის!`,
        type: 'success',
        icon: TrendingUp
      });
    }

    // Check specific categories
    const foodSpent = expenseByCategory['საჭმელი'] || 0;
    if (foodSpent > 300) {
      list.push({
        title: "კვების ხარჯების ანალიზი",
        text: `ამ თვეში კვებაზე დახარჯულია ${foodSpent} ₾. გამოწერების/რესტორნების ნაცვლად შინ მომზადებით შეგიძლიათ დაზოგოთ ~120 ₾.`,
        type: 'warning',
        icon: Lightbulb
      });
    }

    // Budget overruns
    Object.keys(budgets).forEach(cat => {
      const limit = budgets[cat];
      const spent = expenseByCategory[cat] || 0;
      if (spent > limit) {
        list.push({
          title: `გადახარჯვა კატეგორიაში: ${cat}`,
          text: `თქვენ გადააჭარბეთ დაწესებულ ლიმიტს (${limit} ₾) და დახარჯეთ ${spent} ₾.`,
          type: 'danger',
          icon: AlertTriangle
        });
      }
    });

    return list;
  };

  const prodInsights = getProductivityInsights();
  const finInsights = getFinancialInsights();

  return (
    <div className="insights-page">
      <header className="page-header" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>ინსაითები & AI</h1>
        <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>პერსონალიზებული AI რეკომენდაციები და პროდუქტიულობის/ფინანსური ანალიტიკა</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Productivity Insights */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <Sparkles size={20} style={{ color: 'hsl(var(--primary))' }} />
            პროდუქტიულობის ინსაითები
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {prodInsights.map((ins, index) => {
              const Icon = ins.icon;
              return (
                <div 
                  key={index} 
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: ins.type === 'success' ? 'rgba(16, 185, 129, 0.04)' : ins.type === 'warning' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid ' + (ins.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : ins.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'var(--border-light)'),
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ 
                    padding: '0.5rem', 
                    borderRadius: '8px', 
                    background: ins.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : ins.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                    color: ins.type === 'success' ? 'hsl(var(--accent-emerald))' : ins.type === 'warning' ? 'hsl(var(--accent-amber))' : 'hsl(var(--primary-hover))',
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{ins.title}</h4>
                    <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem', lineHeight: '1.4' }}>{ins.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Financial Insights */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <Lightbulb size={20} style={{ color: 'hsl(var(--accent-amber))' }} />
            ფინანსური ინსაითები
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {finInsights.map((ins, index) => {
              const Icon = ins.icon;
              return (
                <div 
                  key={index} 
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: ins.type === 'success' ? 'rgba(16, 185, 129, 0.04)' : ins.type === 'danger' ? 'rgba(239, 68, 68, 0.04)' : ins.type === 'warning' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid ' + (ins.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : ins.type === 'danger' ? 'rgba(239, 68, 68, 0.15)' : ins.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'var(--border-light)'),
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ 
                    padding: '0.5rem', 
                    borderRadius: '8px', 
                    background: ins.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : ins.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : ins.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    color: ins.type === 'success' ? 'hsl(var(--accent-emerald))' : ins.type === 'danger' ? 'hsl(var(--accent-rose))' : ins.type === 'warning' ? 'hsl(var(--accent-amber))' : 'hsl(var(--text-secondary))',
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{ins.title}</h4>
                    <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem', lineHeight: '1.4' }}>{ins.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
