/*
# Create budgeting schema (single-tenant, no auth)

## Overview
Creates the core tables for "Paise Kahan Gaye Bhai?" — a budgeting, expenses & saving app.
No authentication is required, so all policies allow anon + authenticated access.

## New Tables

### categories
- `id` (uuid, primary key)
- `name` (text, not null) — category name e.g. "Food", "Transport"
- `icon` (text, not null) — lucide icon name for display
- `color` (text, not null) — hex color for charts
- `is_default` (boolean, default false) — whether this is a pre-seeded category
- `created_at` (timestamptz)

### expenses
- `id` (uuid, primary key)
- `amount` (numeric(12,2), not null) — expense amount
- `description` (text, not null) — what the expense was for
- `category_id` (uuid, FK to categories, not null)
- `date` (date, not null) — when the expense occurred
- `created_at` (timestamptz)

### budgets
- `id` (uuid, primary key)
- `category_id` (uuid, FK to categories, not null) — which category this budget is for
- `amount` (numeric(12,2), not null) — monthly budget limit
- `month` (date, not null) — first day of the budget month
- `created_at` (timestamptz)
- UNIQUE constraint on (category_id, month) — one budget per category per month

### savings_goals
- `id` (uuid, primary key)
- `name` (text, not null) — goal name e.g. "Vacation Fund"
- `target_amount` (numeric(12,2), not null) — how much to save
- `current_amount` (numeric(12,2), not null, default 0) — saved so far
- `target_date` (date) — optional deadline
- `created_at` (timestamptz)

## Security
- RLS enabled on all tables.
- All policies allow anon + authenticated CRUD (single-tenant, no auth app).
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'Wallet',
  color text NOT NULL DEFAULT '#1b80f5',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  month date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (category_id, month)
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_amount numeric(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date date,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Categories policies
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
TO anon, authenticated USING (true);

-- Expenses policies
DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE
TO anon, authenticated USING (true);

-- Budgets policies
DROP POLICY IF EXISTS "anon_select_budgets" ON budgets;
CREATE POLICY "anon_select_budgets" ON budgets FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_budgets" ON budgets;
CREATE POLICY "anon_insert_budgets" ON budgets FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_budgets" ON budgets;
CREATE POLICY "anon_update_budgets" ON budgets FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_budgets" ON budgets;
CREATE POLICY "anon_delete_budgets" ON budgets FOR DELETE
TO anon, authenticated USING (true);

-- Savings goals policies
DROP POLICY IF EXISTS "anon_select_savings_goals" ON savings_goals;
CREATE POLICY "anon_select_savings_goals" ON savings_goals FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_savings_goals" ON savings_goals;
CREATE POLICY "anon_insert_savings_goals" ON savings_goals FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_savings_goals" ON savings_goals;
CREATE POLICY "anon_update_savings_goals" ON savings_goals FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_savings_goals" ON savings_goals;
CREATE POLICY "anon_delete_savings_goals" ON savings_goals FOR DELETE
TO anon, authenticated USING (true);
