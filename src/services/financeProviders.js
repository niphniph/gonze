export const financeService = {
  // Provider Abstraction Selector
  getProvider: (providerName) => {
    switch (providerName) {
      case 'TBC Bank':
      case 'Bank of Georgia':
      case 'Liberty Bank':
      default:
        return MockFinanceProvider;
    }
  }
};

const MockFinanceProvider = {
  connect: async (bankName, username, password) => {
    return new Promise((resolve, reject) => {
      if (!bankName || !username || !password) {
        reject(new Error('Missing bank select or credentials.'));
      }
      setTimeout(() => {
        resolve({
          connected: true,
          bankName,
          lastSyncAt: new Date().toISOString()
        });
      }, 1200);
    });
  },

  getAccounts: async (bankName) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: `acc-1`, name: `${bankName} Checking`, type: 'checking', balance: 4250.00, bankName },
          { id: `acc-2`, name: `${bankName} Savings`, type: 'savings', balance: 12400.00, bankName },
          { id: `acc-3`, name: `${bankName} Visa Card`, type: 'credit', balance: -850.00, bankName }
        ]);
      }, 800);
    });
  },

  getTransactions: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: `tx-1`, accountId: `acc-1`, amount: 2800, type: 'income', category: 'ხელფასი', date: '2026-06-01', note: 'შემოსავალი ხელფასიდან' },
          { id: `tx-2`, accountId: `acc-1`, amount: 120, type: 'expense', category: 'საჭმელი', date: '2026-06-11', note: 'სუპერმარკეტი ორნაბიჯი' },
          { id: `tx-3`, accountId: `acc-1`, amount: 1500, type: 'expense', category: 'ქირა', date: '2026-06-02', note: 'ბინის ქირა' },
          { id: `tx-4`, accountId: `acc-1`, amount: 75, type: 'expense', category: 'კომუნალური', date: '2026-06-05', note: 'თელასი კომუნალურები' },
          { id: `tx-5`, accountId: `acc-1`, amount: 35, type: 'expense', category: 'ტრანსპორტი', date: '2026-06-09', note: 'Yandex Taxi' },
          { id: `tx-6`, accountId: `acc-3`, amount: 180, type: 'expense', category: 'შოპინგი', date: '2026-06-10', note: 'Zara clothing' },
          { id: `tx-7`, accountId: `acc-3`, amount: 110, type: 'expense', category: 'გართობა', date: '2026-06-08', note: 'Cavea Cinema' },
          { id: `tx-8`, accountId: `acc-1`, amount: 450, type: 'income', category: 'ინვესტიციები', date: '2026-06-07', note: 'დივიდენდები' }
        ]);
      }, 1000);
    });
  }
};
