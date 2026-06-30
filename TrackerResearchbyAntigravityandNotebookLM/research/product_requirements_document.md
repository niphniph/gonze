# Product Requirements Document (PRD): Gonze Tracker v2

This document details the requirements and functional specifications for upgrading Gonze Tracker into a premium, unified AI-native planning, meeting, and finance intelligence platform.

---

## 1. Product Requirements Summary
Modern productivity and personal finance users expect automated time-blocking, minimal manual data entry, calendar-aware task scheduling, and secure account connections with actionable, plain-English insights. 

### Gonze Tracker's Differentiators:
1. **Time-Money Connection:** Blends the user's schedule (meetings, plans) with their budgets and savings goals (e.g., matching client meetings with invoicing trackers, warning of budget constraints in the daily planner).
2. **Frictionless Calendar Sync & Meet Generation:** Instantly creates Google Calendar events and attaches Google Meet links directly when tasks or meetings are defined, bypassing manual scheduling.
3. **Privacy-Preserving PFM:** Stores sensitive banking statements and calendar access tokens directly in local browser storage, offering users complete data ownership and disconnect/delete capabilities.

---

## 2. Core Functional Requirements

### Feature A: Google Calendar + Google Meet + Gmail Integration
* **G1: Google OAuth Setting Page:** Users can toggle between Sandbox (Demo) and Production mode. In Production mode, users input a Client ID and API Key to trigger the Google Identity Services flow. Shows permission status (Calendar, Gmail) and a disconnect button.
* **G2: Calendar Sync option in Tasks/Planner:** Toggles to sync any task, meeting, or event directly to Google Calendar.
* **G3: Auto-Google Meet Creation:** Toggles to auto-create Google Meet links for meeting-type items.
* **G4: Gmail invitation flow:** Allows adding participant emails, sending invitation emails through the Google account upon event creation.
* **G5: Timezone Handling & Success/Error UI:** Handles timezone alignment and shows beautiful loading, success, and error feedback states.

### Feature B: Finance Analyzer
* **F1: Banking Provider Abstraction:** A clean interface mapping mock PFM data by default, and structured to swap in Plaid or Salt Edge APIs.
* **F2: Bank Onboarding Flow:** Beautiful modal to select and connect mock accounts (TBC Bank, BOG, Liberty Bank).
* **F3: Spending Dashboard Widgets:** Displays net balance, monthly income, monthly expenses, budget overruns, and savings progress.
* **F4: Categorization and Editable Categories:** Renders category breakdown charts (Recharts) and permits editing categories for any transaction, automatically updating budgets.
* **F5: Budgets and Savings Goals:** Interactive form to set monthly budget limits per category and define savings goals with visual progress bars.
* **F6: Deterministic AI Insights:** Rule-based insights indicating spending anomalies, savings advice, and budget warnings.
* **F7: Access Revocation & Data Purge:** One-click account disconnect that instantly deletes all financial connections, statements, budgets, and goals.

---

## 3. Technical & Security Specifications
1. **OAuth Safety:** Never request or store Google or banking passwords. Use browser-level OAuth authorization.
2. **Encryption:** Obfuscate/encrypt tokens and financial identifiers at rest in `localStorage`.
3. **UI/UX Consistency:** Maintain the existing aesthetic direction: deep backgrounds, curated neon gradients, glassmorphism cards, and Plus Jakarta Sans typography. Enhance with smooth hover micro-animations.
4. **Localization:** Provide dual-language Georgian (ka) and English (en) support for all labels, modals, and charts.
5. **Mobile Responsiveness:** Use CSS Flexbox/Grid structures to ensure layouts scale smoothly on mobile and desktop viewports.
