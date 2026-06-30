import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="antialiased min-h-screen flex flex-col bg-background text-on-background overflow-x-hidden relative">
      {/* Top Navigation */}
      <header className="w-full bg-surface/80 backdrop-blur-md border-b border-surface-container sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-4 flex justify-between items-center">
          <div className="font-headline-md text-headline-md font-bold text-primary">Nine's Tracker</div>
          <nav className="flex gap-6 items-center">
            <a className="hidden md:block text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#features">
              Features
            </a>
            <button
              onClick={() => navigate('/login')}
              className="bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity cursor-pointer"
            >
              Login
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-container-padding-mobile md:px-container-padding-desktop max-w-[1280px] mx-auto text-center flex flex-col items-center">
          {/* Ambient Glow */}
          <div className="absolute rounded-full blur-[100px] opacity-15 pointer-events-none -z-10 bg-primary w-[400px] h-[400px] top-[-100px] left-1/2 transform -translate-x-1/2"></div>
          
          <h1 className="font-display-lg text-display-lg mb-6 max-w-4xl text-text-primary leading-tight">
            Simplify your life, <br />
            <span className="text-primary">one day at a time.</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-10">
            A premium sanctuary for your personal productivity. Track your habits, manage your tasks, and oversee your finances in one beautifully integrated space.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-primary to-primary-container text-on-primary-container px-8 py-4 rounded-full font-title-lg text-title-lg hover:shadow-[0_0_20px_rgba(192,193,255,0.4)] transition-all transform hover:-translate-y-1 cursor-pointer"
          >
            Get Started
          </button>

          {/* Dashboard Mockup Preview */}
          <div className="mt-20 w-full max-w-5xl relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10 transform scale-x-150"></div>
            <div className="glass-card rounded-xl p-2 shadow-2xl shadow-primary/10 bg-surface/60 backdrop-blur-md border border-white/10">
              <img
                className="w-full h-auto rounded-lg object-cover aspect-video border border-surface-container"
                alt="Nine's Tracker Dashboard Mockup"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO2HKlheaF-QsJwZqdu0vKFoFWpnMnpZ-E_BRE2l8LNEF6HCTtZZYBoMme5wtMNwBFWbMDG1awc6i_b1xmP0iq6CFoGGoYdBE9WnRn0onUeFL0FwXndlBwwj1yn8EzONeU1eSdn_JXElPMasyhef5j_X2Cg-pMPYV5zwGdG5f6B1rsPlOP-c6_Oc5HbKSYqS43ni8LVPNzoUDiQydGasq2-Ts74VLD0pft0u1_6aSdj0C3yuihVwvSJzO4a9zaqej5AiIJupafDfc"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-container-padding-mobile md:px-container-padding-desktop max-w-[1280px] mx-auto relative" id="features">
          <div className="absolute rounded-full blur-[100px] opacity-15 pointer-events-none -z-10 bg-secondary w-[300px] h-[300px] bottom-0 right-[-100px]"></div>
          
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-text-primary mb-4">Everything you need. Nothing you don't.</h2>
            <p className="text-on-surface-variant font-body-md text-body-md max-w-xl mx-auto">
              Designed for clarity and focus, removing the clutter so you can achieve more with less noise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Task Tracker */}
            <div className="glass-card rounded-xl p-8 flex flex-col items-start hover:-translate-y-2 transition-transform duration-300 bg-surface/60 backdrop-blur-md border border-white/10">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
              </div>
              <h3 className="font-title-lg text-title-lg text-text-primary mb-3">Task Tracker</h3>
              <p className="text-on-surface-variant font-body-md text-body-md">
                Organize your daily to-dos with elegant simplicity. Prioritize what matters and clear your mind.
              </p>
            </div>

            {/* Habit Tracker */}
            <div className="glass-card rounded-xl p-8 flex flex-col items-start hover:-translate-y-2 transition-transform duration-300 bg-surface/60 backdrop-blur-md border border-white/10">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-6 text-secondary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>cached</span>
              </div>
              <h3 className="font-title-lg text-title-lg text-text-primary mb-3">Habit Tracker</h3>
              <p className="text-on-surface-variant font-body-md text-body-md">
                Build lasting routines. Visual streaks and progress tracking keep you motivated every single day.
              </p>
            </div>

            {/* Finance Tracker */}
            <div className="glass-card rounded-xl p-8 flex flex-col items-start hover:-translate-y-2 transition-transform duration-300 bg-surface/60 backdrop-blur-md border border-white/10">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-6 text-tertiary-container">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
              <h3 className="font-title-lg text-title-lg text-text-primary mb-3">Finance Tracker</h3>
              <p className="text-on-surface-variant font-body-md text-body-md">
                Monitor your wealth seamlessly. Beautiful, clutter-free visualizations of your spending and savings.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-outline-variant mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center px-container-padding-desktop py-8 w-full max-w-[1280px] mx-auto gap-4">
          <div className="font-headline-md text-headline-md text-primary font-bold">Nine's Tracker</div>
          <div className="text-text-muted font-label-sm text-label-sm">
            © 2024 Nine's Tracker. Your Life, Quantified.
          </div>
          <div className="flex gap-6">
            <a className="text-text-muted hover:text-primary transition-colors font-label-sm text-label-sm" href="#">Privacy</a>
            <a className="text-text-muted hover:text-primary transition-colors font-label-sm text-label-sm" href="#">Terms</a>
            <a className="text-text-muted hover:text-primary transition-colors font-label-sm text-label-sm" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
