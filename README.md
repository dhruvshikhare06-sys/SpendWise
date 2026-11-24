# SpendWise 3.0 — Personal Finance Intelligence Platform

A browser-based finance intelligence prototype built with HTML5, CSS3 and vanilla JavaScript.

## Run locally
1. Extract the ZIP.
2. Open `SpendWise/index.html` in a modern browser (or use VS Code Live Server).
3. An internet connection is used for Chart.js, Font Awesome and Google Fonts CDNs.

## Features
- Dashboard with cash flow, income, expenses and category analytics
- CSV bank statement import with column mapping and preview
- Basic duplicate detection during import
- Rule-based transaction categorization with manual correction
- Manual transaction entry and management
- Multiple currency codes (INR, USD, EUR, GBP, AED, CAD, AUD)
- Currency-filtered reports; no automatic FX conversion or guessed exchange rates
- Budgets, savings goals and recurring-payment reminders
- Spending insights based on imported or entered transaction data
- Demo transactions that can be cleared separately
- Local profiles, light/dark mode, CSV export and JSON backup/restore

## Important limitations
- CSV is supported; PDF statement extraction is not implemented.
- CSV import is processed locally in the browser; there is no bank connection or server upload.
- Categorization uses transparent keyword rules, not a trained AI/ML model.
- Multiple currencies are stored and reported separately. SpendWise does not convert them into a single total. Select a reporting currency to filter dashboard and analytics.
- Recurring entries are reminders only; they do not initiate payments or automatically create bank transactions.
- Profiles are local browser workspaces, not secure online accounts. Clearing browser data can remove records; export JSON backups regularly.
- This is an educational prototype, not a bank-connected financial product or financial advice service.
