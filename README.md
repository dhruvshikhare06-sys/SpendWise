# SpendWise 3.0 – Personal Finance Intelligence Platform

**Your Money. Understood.**

SpendWise is a browser-based personal finance management and analytics application designed to help users organise transactions, monitor expenses, manage budgets and understand their spending habits through clear dashboards and visual insights.

The application brings essential financial tracking tools together in one simple, responsive interface.

## Overview

Managing personal finances often involves checking multiple payment applications, bank statements and spreadsheets. SpendWise simplifies this process by providing a central platform where users can record transactions, import financial data, analyse spending patterns and track their financial goals.

Users can manually add transactions or import supported CSV files. The application organises transaction data into categories and presents summaries through an interactive dashboard and analytics section.

## Key Features

### 1. Dashboard
- Overview of total income, expenses and available balance.
- Savings rate and financial summaries.
- Top-spending category insights.
- Visual representation of financial activity.
- Six-month income and expense comparison.

### 2. Transaction Management
- Add income and expense transactions manually.
- View and manage transaction history.
- Edit or delete existing transactions.
- Organise transactions using categories.
- Automatically categorise transactions using keyword-based rules.
- Manually correct assigned categories when required.

### 3. CSV Import
- Import transaction records from supported CSV files.
- Preview records before importing.
- Map CSV columns to the appropriate transaction fields.
- Basic duplicate detection to prevent repeated imports.
- Review imported transactions in the transaction history.

### 4. Analytics and Insights
- Analyse income and expense patterns.
- Identify categories with the highest spending.
- View financial summaries and visual charts.
- Compare income and expenses over time.
- Understand spending behaviour using available transaction data.

### 5. Budget Management
- Create budgets for individual spending categories.
- Set spending limits.
- Monitor budget usage and remaining amounts.
- Receive warnings when spending approaches the budget limit.

### 6. Savings Goals
- Create personalised savings goals.
- Set target amounts.
- Record savings contributions.
- Track progress towards financial targets.

### 7. Recurring Payment Reminders
- Add recurring payment reminders.
- Record payment names, amounts and due dates.
- Keep track of upcoming financial commitments.

### 8. Personalisation and Data Management
- Multiple local profiles.
- Light and dark appearance modes.
- Export transaction records as CSV.
- Create and restore JSON backups.
- Demo transactions for exploring the application.

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Structures the application interface. |
| CSS3 | Handles styling, layouts and responsive design. |
| JavaScript | Implements application logic and interactive features. |
| Browser LocalStorage | Retains application data between visits. |
| Chart.js | Displays financial charts and visual analytics. |
| Font Awesome | Provides interface icons. |
| Google Fonts | Provides application typography. |

## Project Structure

```text
SpendWise/
│
├── index.html    # Main application interface
├── styles.css    # Styling and responsive layouts
├── app.js        # Application logic and functionality
└── README.md     # Project documentation
```

## Getting Started

### Run Locally

1. Download or clone this repository.
2. Extract the project files if downloaded as a ZIP.
3. Open the `SpendWise` folder.
4. Open `index.html` in a modern web browser.

For development, you can also open the folder in Visual Studio Code and use the Live Server extension.

An active internet connection is required to load the external libraries, icons and fonts used by the interface.

## How SpendWise Works

1. **Add Data:** Enter transactions manually or import a supported CSV file.
2. **Organise:** Review transactions and use automatic keyword-based categorisation.
3. **Analyse:** Explore financial summaries, charts and spending insights.
4. **Manage:** Set budgets, monitor savings goals and create payment reminders.
5. **Back Up:** Export transaction records or create JSON backups for later restoration.

## Data Storage

SpendWise stores its application data using the browser's LocalStorage. This allows information such as transactions, profiles and preferences to remain available when the application is reopened in the same browser.

The application processes imported CSV records locally in the browser.

## Project Scope

SpendWise is an academic project demonstrating the development of an interactive personal finance management application using frontend web technologies.

It focuses on transaction organisation, financial analytics, budget tracking and savings management through a simple and accessible interface.

---

**SpendWise 3.0**

*Your Money. Understood.*
