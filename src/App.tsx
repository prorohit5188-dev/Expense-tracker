import { useState, useEffect, useCallback } from 'react'
import { supabase, type ExpenseWithCategory, type BudgetWithCategory, type SavingsGoal, type Category } from './lib/supabase'
import { useCategories } from './hooks/useCategories'
import { getCurrentMonthFirst, getMonthKey } from './lib/format'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ExpensesView from './components/ExpensesView'
import BudgetsView from './components/BudgetsView'
import SavingsView from './components/SavingsView'

export type View = 'dashboard' | 'expenses' | 'budgets' | 'savings'

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { categories, setCategories } = useCategories()
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([])
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, categories(*)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching expenses:', error)
      return
    }
    setExpenses((data as ExpenseWithCategory[]) || [])
  }, [])

  const fetchBudgets = useCallback(async () => {
    const currentMonth = getCurrentMonthFirst()
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(*)')
      .eq('month', currentMonth)
    if (error) {
      console.error('Error fetching budgets:', error)
      return
    }
    setBudgets((data as BudgetWithCategory[]) || [])
  }, [])

  const fetchSavingsGoals = useCallback(async () => {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching savings goals:', error)
      return
    }
    setSavingsGoals((data as SavingsGoal[]) || [])
  }, [])

  useEffect(() => {
    Promise.all([fetchExpenses(), fetchBudgets(), fetchSavingsGoals()]).finally(() =>
      setLoading(false),
    )
  }, [fetchExpenses, fetchBudgets, fetchSavingsGoals])

  const handleNavigate = (v: View) => {
    setView(v)
    setSidebarOpen(false)
  }

  const currentMonthKey = getMonthKey(getCurrentMonthFirst())
  const monthExpenses = expenses.filter(
    (e) => getMonthKey(e.date) === currentMonthKey,
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        view={view}
        onNavigate={handleNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 lg:ml-72 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          <span className="font-display font-bold text-slate-800">Paise Kahan Gaye Bhai?</span>
          <div className="w-9" />
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          {view === 'dashboard' && (
            <Dashboard
              expenses={expenses}
              monthExpenses={monthExpenses}
              budgets={budgets}
              savingsGoals={savingsGoals}
              loading={loading}
              onNavigate={handleNavigate}
            />
          )}
          {view === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              categories={categories}
              loading={loading}
              onRefresh={fetchExpenses}
              onCategoriesChange={setCategories}
            />
          )}
          {view === 'budgets' && (
            <BudgetsView
              budgets={budgets}
              categories={categories}
              monthExpenses={monthExpenses}
              onRefresh={fetchBudgets}
            />
          )}
          {view === 'savings' && (
            <SavingsView
              savingsGoals={savingsGoals}
              onRefresh={fetchSavingsGoals}
            />
          )}
        </div>
      </main>
    </div>
  )
}
