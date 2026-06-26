import { useState } from 'react';
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

export const Insights = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [tasks] = useState(() => db.getTasks() || []);
  const [habits] = useState(() => {
    const data = db.getHabits();
    return data.list || [];
  });
  const [transactions] = useState(() => db.getTransactions() || []);
  const [budgets] = useState(() => db.getBudgets() || {});

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
    if (cat.includes('სხვა ხარჯი')) return 'Other Expense';
    return cat;
  };

  // Dynamic Insights Engine
  const getProductivityInsights = () => {
    const list = [];
    
    if (tasks.length === 0) {
      list.push({
        title: t("პროდუქტიულობის ინდექსი", "Productivity Index"),
        text: t("დაამატეთ დავალებები და ჩვევები, რათა AI-მ შეძლოს თქვენი მუშაობის ტემპის გაანალიზება.", "Add tasks and habits so the AI can analyze your productivity pace."),
        type: 'info',
        icon: Clock
      });
      return list;
    }

    if (taskCompletionRate >= 75) {
      list.push({
        title: t("შესანიშნავი პროდუქტიულობა!", "Excellent Productivity!"),
        text: t(`თქვენი დავალებების შესრულების მაჩვენებელი არის მაღალი: ${taskCompletionRate}%. გააგრძელეთ იგივე ტემპით.`, `Your task completion rate is high: ${taskCompletionRate}%. Keep up the good work.`),
        type: 'success',
        icon: CheckCircle
      });
    } else if (taskCompletionRate < 40) {
      list.push({
        title: t("დაბალი პროდუქტიულობის მაჩვენებელი", "Low Productivity Rate"),
        text: t(`შესრულებულია დავალებების მხოლოდ ${taskCompletionRate}%. გირჩევთ, გაანაწილოთ დავალებები დღეებზე უფრო თანაბრად.`, `Only ${taskCompletionRate}% of tasks completed. We suggest distributing tasks more evenly across days.`),
        type: 'warning',
        icon: AlertTriangle
      });
    } else {
      list.push({
        title: t("სტაბილური პროგრესი", "Steady Progress"),
        text: t(`დავალებების ${taskCompletionRate}% წარმატებით შესრულებულია. შეეცადეთ პრიორიტეტული დავალებები დღის პირველ ნახევარში გააკეთოთ.`, `Your task completion is ${taskCompletionRate}%. Try to do priority tasks in the first half of the day.`),
        type: 'info',
        icon: Zap
      });
    }

    if (habits.length > 0) {
      list.push({
        title: t("ჩვევების კონსისტენტურობა", "Habit Consistency"),
        text: t("ყველაზე მაღალი აქტივობა ჩვევების მხრივ შეინიშნება დილის საათებში. დილის ჩვევები უფრო მყარად ყალიბდება.", "Most habit activity is observed in the morning. Morning habits form more consistently."),
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
        title: t("ფინანსური რეპორტები", "Financial Reports"),
        text: t("შეაერთეთ თქვენი საბანკო ანგარიში 'ფინანსების ანალიზი' გვერდიდან ტრანზაქციების გასაანალიზებლად.", "Connect your bank account from the 'Finance Analyzer' page to analyze transactions."),
        type: 'info',
        icon: Lightbulb
      });
      return list;
    }

    if (totalExpenses > totalIncome && totalIncome > 0) {
      list.push({
        title: t("უარყოფითი ფულადი ნაკადი", "Negative Cash Flow"),
        text: t(`თქვენი ხარჯები აჭარბებს შემოსავლებს ${totalExpenses - totalIncome} ₾-ით. გირჩევთ, შეამციროთ არაპრიორიტეტული შოპინგის და გართობის ხარჯები.`, `Your expenses exceed your income by ${totalExpenses - totalIncome} ₾. We recommend reducing non-priority shopping and entertainment expenses.`),
        type: 'danger',
        icon: TrendingDown
      });
    } else if (totalIncome > 0) {
      const savingsRate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 100);
      list.push({
        title: t("პოზიტიური ბალანსი", "Positive Balance"),
        text: t(`თქვენ ზოგავთ შემოსავლის ${savingsRate}%-ს. ეს ძალიან კარგი მაჩვენებელია დაგროვების მიზნებისთვის!`, `You save ${savingsRate}% of your income. This is a very good rate for savings goals!`),
        type: 'success',
        icon: TrendingUp
      });
    }

    // Check specific categories
    const foodSpent = expenseByCategory['საჭმელი'] || 0;
    if (foodSpent > 300) {
      list.push({
        title: t("კვების ხარჯების ანალიზი", "Food Expense Analysis"),
        text: t(`ამ თვეში კვებაზე დახარჯულია ${foodSpent} ₾. გამოწერების/რესტორნების ნაცვლად შინ მომზადებით შეგიძლიათ დაზოგოთ ~120 ₾.`, `This month ${foodSpent} ₾ was spent on food. Cooking at home instead of eating out/delivery can save around ~120 ₾.`),
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
          title: t(`გადახარჯვა კატეგორიაში: ${translateFinanceCategory(cat)}`, `Budget overrun in: ${translateFinanceCategory(cat)}`),
          text: t(`თქვენ გადააჭარბეთ დაწესებულ ლიმიტს (${limit} ₾) და დახარჯეთ ${spent} ₾.`, `You exceeded the set limit (${limit} ₾) and spent ${spent} ₾.`),
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
        <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>{t('ინსაითები & AI', 'AI Insights')}</h1>
        <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>{t('პერსონალიზებული AI რეკომენდაციები და პროდუქტიულობის/ფინანსური ანალიტიკა', 'Personalized AI recommendations and productivity/financial analytics')}</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Productivity Insights */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <Sparkles size={20} style={{ color: 'hsl(var(--primary))' }} />
            {t('პროდუქტიულობის ინსაითები', 'Productivity Insights')}
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
            {t('ფინანსური ინსაითები', 'Financial Insights')}
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
