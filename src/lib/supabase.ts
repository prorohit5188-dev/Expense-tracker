import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Category = {
  id: string
  name: string
  icon: string
  color: string
  is_default: boolean
  created_at: string
}

export type Expense = {
  id: string
  amount: number
  description: string
  category_id: string
  date: string
  created_at: string
}

export type ExpenseWithCategory = Expense & {
  categories: Category
}

export type Budget = {
  id: string
  category_id: string
  amount: number
  month: string
  created_at: string
}

export type BudgetWithCategory = Budget & {
  categories: Category
}

export type SavingsGoal = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  created_at: string
}
