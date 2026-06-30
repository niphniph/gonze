# Finance Provider Abstraction Research

This document outlines the architecture for a multi-provider personal finance integration model in Gonze Tracker, accommodating Plaid, Salt Edge, Open Banking standards, and a robust Mock/Sandbox provider.

---

## 1. Banking Provider Abstraction (Interface)
We will design a unified JavaScript class interface (`FinanceProvider`) that abstracts PFM operations. This ensures that the rest of the application remains agnostic to the underlying banking aggregator.

```typescript
interface FinanceProvider {
  name: string;
  connect(credentials: any): Promise<boolean>;
  disconnect(): Promise<boolean>;
  getAccounts(): Promise<FinancialAccount[]>;
  getTransactions(accountId: string, startDate: string, endDate: string): Promise<Transaction[]>;
}
```

---

## 2. Aggregator Models

### Plaid
* **Auth:** Plaid Link client token flow + server-side exchange for `access_token`.
* **Endpoints:**
  * `/accounts/get` (Fetch balances, account numbers, routing numbers).
  * `/transactions/sync` or `/transactions/get` (Retrieve transaction logs, merchants, coordinates, and categories).
* **Data Payload:** Returns standardized categorizations (e.g., Personal Finance Category codes).

### Salt Edge & Open Banking (EU/UK)
* **Auth:** Consent redirects via AIS (Account Information Service) APIs.
* **Endpoints:**
  * `/api/v5/accounts`
  * `/api/v5/transactions`
* **Data Payload:** Strong customer authentication (SCA) constraints and recurring consent renewals every 90 days.

---

## 3. Mock Provider Implementation (Sandbox)
To allow Gonze Tracker to work fully in development and demo modes, we implement a `MockFinanceProvider`.

### Capabilities:
1. **Interactive Connect Flow:** Simulates a secure bank select and authorization dashboard (TBC Bank, Bank of Georgia, Liberty Bank) with credentials validation.
2. **Deterministic Transaction Generation:** Seeds realistic monthly transactions representing:
   * **Income:** Monthly Salary, Freelance income, Dividends.
   * **Recurring Expenses:** Apartment Rent, Utilities, Subscriptions (Netflix, Spotify, Cloud).
   * **Daily Expenses:** Groceries, Cinema, Taxi rides.
3. **Editable Category Mapping:** Supports updating the category of a transaction. The dashboard must immediately recalculate budget progress, category distributions, and spending trends.
4. **Data Purge:** A clean disconnect function that purges accounts, transactions, budgets, goals, and legacy ledgers from `localStorage`.
