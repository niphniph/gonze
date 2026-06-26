
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  CalendarDays,
  DollarSign, 
  Award, 
  Clock, 
  Video, 
  Link as LinkIcon, 
  PieChart, 
  Sparkles, 
  Settings
} from 'lucide-react';
import { db } from '../utils/db';

export const Navbar = ({ activePage, setActivePage, language, setLanguage }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const profile = db.getProfile();

  const navCategories = [
    {
      title: t('პროდუქტიულობა', 'Productivity'),
      items: [
        { id: 'dashboard', label: t('დეშბორდი', 'Dashboard'), icon: LayoutDashboard },
        { id: 'planner', label: t('პლანერი', 'Planner'), icon: Clock },
        { id: 'tasks', label: t('დავალებები', 'Tasks'), icon: CheckSquare },
        { id: 'habits', label: t('ჩვევები', 'Habits'), icon: Award },
        { id: 'weekly', label: t('კვირეული', 'Weekly Tracker'), icon: CalendarDays },
        { id: 'calendar', label: t('კალენდარი', 'Calendar'), icon: Calendar },
        { id: 'meetings', label: t('შეხვედრები', 'Meetings'), icon: Video }
      ]
    },
    {
      title: t('ფინანსები', 'Finance'),
      items: [
        { id: 'finance', label: t('ფინანსები', 'Finance Ledger'), icon: DollarSign },
        { id: 'finance_analyzer', label: t('ანალიზი', 'Finance Analyzer'), icon: PieChart }
      ]
    },
    {
      title: t('კავშირი & სისტემა', 'System'),
      items: [
        { id: 'google_integrations', label: t('Google ინტეგრაცია', 'Google Integration'), icon: LinkIcon },
        { id: 'insights', label: t('ინსაითები', 'AI Insights'), icon: Sparkles },
        { id: 'settings', label: t('პარამეტრები', 'Settings'), icon: Settings }
      ]
    }
  ];

  // Mobile Bottom Nav items (primary 5 items for mobile viewport)
  const mobileNavItems = [
    { id: 'dashboard', label: t('დეშბორდი', 'Dashboard'), icon: LayoutDashboard },
    { id: 'planner', label: t('პლანერი', 'Planner'), icon: Clock },
    { id: 'meetings', label: t('შეხვედრები', 'Meetings'), icon: Video },
    { id: 'finance_analyzer', label: t('ანალიზი', 'Finance'), icon: PieChart },
    { id: 'settings', label: t('პარამეტრები', 'Settings'), icon: Settings }
  ];

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="bg-surface-container border-r border-border-hairline h-screen w-64 hidden md:flex flex-col fixed left-0 top-0 z-50">
        <div className="flex flex-col h-full py-6">
          
          {/* Brand Logo */}
          <div className="px-6 mb-8 flex justify-between items-center">
            <h1 className="font-headline-md text-headline-md font-extrabold text-white tracking-tight">Gonze</h1>
            
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-black/35 rounded-lg p-0.5 border border-border-hairline">
              <button 
                onClick={() => setLanguage('ka')} 
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${language === 'ka' ? 'bg-accent-indigo text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                GE
              </button>
              <button 
                onClick={() => setLanguage('en')} 
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${language === 'en' ? 'bg-accent-indigo text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Profile Header */}
          <div className="px-6 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-indigo flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
              <img 
                className="w-full h-full object-cover" 
                alt="Profile Avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBt-_JfINy3vL-V4v3kSjinfRAHgopEwUG-5H604EnPUuo-up30xeKmKY0sFvlFYnMEeaXP_5I1HVRZVy8br5FCSh2DQ35MA5PbSvCx7huXODgwF5Ih2cDfhcYZG2ZGL-pDY7sFOHg3XeWn6vu0WbF79DG5Zsxm7xJkZ4QepQyUYKmuppRc_Pp-2M8XYuAShfuLPuJVJdvjxrPt7EmBc0xVmtwdCaY_ITxdDqA0fTj88EbNNERsWMDQgqvJZIEDIDAgXlsnZlpA-5M"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-md text-body-md font-bold text-text-primary truncate">{profile.name}</span>
              <span className="text-[9px] text-accent-indigo font-bold tracking-widest uppercase truncate">{profile.email}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-4 overflow-y-auto no-scrollbar">
            {navCategories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest px-4 mb-2">
                  {cat.title}
                </div>
                <div className="space-y-1">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActivePage(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                          isActive 
                            ? 'text-white font-bold bg-white/5 border-r-2 border-accent-indigo shadow-md shadow-accent-indigo/5' 
                            : 'text-text-secondary hover:bg-white/5 hover:text-text-primary font-medium'
                        }`}
                      >
                        <Icon size={18} className={isActive ? 'text-accent-indigo' : ''} />
                        <span className="font-body-md text-body-md">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav className="bg-surface-container-high/90 backdrop-blur-lg fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 border-t border-border-hairline shadow-lg md:hidden">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-primary bg-primary-container/20 px-3 py-1 shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-accent-indigo' : ''} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
