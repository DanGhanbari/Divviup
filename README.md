# DivviUp

A shared expense, inventory, and task manager for groups. DivviUp simplifies shared living and group activities by tracking expenses, tasks, and shopping lists with advanced features like fairness algorithms and debt minimization.

## 🚀 Goal

Build a universal group-sharing app supporting one-time groups and ongoing groups (roommates, trips, families) with:
- **Advanced Expense Splitting** (Equal, Percentage, Consumption-based)
- **Task & Chore Management**
- **Collaborative Shopping Lists**
- **Debt Minimization "Smart Settlement"**

## 🛠 Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS v4
- **Backend**: Node.js, Express via various REST API endpoints
- **Database**: PostgreSQL (Relational Data)
- **Authentication**: JWT (JSON Web Tokens)

## 📂 Database Schema (PostgreSQL)

The application uses a relational database with the following core entities:

- **Users**: Authentication and profile info (`name`, `email`, `password_hash`).
- **Groups**: shared workspaces (`name`, `description`).
- **Group Members**: Linking users to groups with roles (`owner`, `admin`, `member`).
- **Expenses**: Financial records with amounts and payers.
- **Expense Splits**: Detailed breakdown of who owes what for an expense.
- **Tasks**: Shared responsibilities with assignment and due dates.
- **Shopping Items**: Collaborative list of items needed.
- **Messages**: Lightweight chat/notes context per group.

*(See `server/schema.sql` for the full DDL)*

## 🧱 Project Structure

This is a monorepo setup containing both client and server:

### Backend (`/server`)
- `server.js`: Main entry point.
- `db.js`: PostgreSQL connection pool.
- `controllers/`: Logic for Auth, Groups, Expenses, Tasks.
- `routes/`: API endpoint definitions.
- `middlewares/`: JWT authentication middleware.

### Frontend (`/client`)
- `src/App.jsx`: Main Router and Layout.
- `src/pages/`:
  - `Login` / `Register`: Authentication flow.
  - `Dashboard`: List of your groups.
  - `GroupDetails`: Tabbed view for managing a specific group's Expenses and Tasks.
- `src/context/`: Global State (AuthContext).
- `src/api.js`: Axios instance with interceptors.

## ✨ Key Features & Algorithms

### 1. Expense Fairness
DivviUp goes beyond simple equal splits. It supports:
- **Equal Split**: Everyone pays the same.
- **Percentage Split**: Adjustable based on income or usage.
- **Custom Split**: Manually assign amounts.

### 2. Debt Minimizer (Smart Settlement)
Instead of A paying B, and B paying C, the system calculates the net balance for all users and suggests the most efficient set of transfers to settle all debts with minimal transactions.

### 3. Task Management
Simple, shared to-do lists for chores or trip planning.

## 🏃‍♂️ How to Run

1. **Database**: Ensure PostgreSQL is running and you have created the `divviup` database.
2. **Server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   Runs on `http://localhost:5001`.

3. **Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Runs on `http://localhost:3000`.

## 🧪 Verification

- **Manual Testing**: User flows verified via Browser Automation.
- **APIs**: Tested via curl/Postman.
