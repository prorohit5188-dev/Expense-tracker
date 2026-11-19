import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  PiggyBank,
  ArrowRight,
  Calendar,
  Target,
  AlertTriangle,
  Receipt,
} from 'lucide-react'
import type { View } from '../App'
import type { ExpenseWithCategory, BudgetWithCategory, SavingsGoal } from '../lib/supabase'
import {
  formatCurrency,
  formatDate,
  getMonthKey,
  getCurrentMonthFirst,
  getMonthName,
  getDaysInMonth,
  getDayOfMonth,
} from '../lib/format'

export default function Dashboard({
  expenses,
  monthExpenses,
  budgets,
  savingsGoals,
  loading,
  onNavigate,
}: {
  expenses: ExpenseWithCategory[]
  monthExpenses: ExpenseWithCategory[]
  budgets: BudgetWithCategory[]
  savingsGoals: SavingsGoal[]
  loading: boolean
  onNavigate: (v: View) => void
}) {
  const currentMonth = getCurrentMonthFirst()

  const totalThisMonth = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [monthExpenses],
  )

  const totalBudget = useMemo(
    () => budgets.reduce((sum, b) => sum + Number(b.amount), 0),
    [budgets],
  )

  const totalSavings = useMemo(
    () => savingsGoals.reduce((sum, g) => sum + Number(g.current_amount), 0),
    [savingsGoals],
  )

  const totalSavingsTarget = useMemo(
    () => savingsGoals.reduce((sum, g) => sum + Number(g.target_amount), 0),
    [savingsGoals],
  )

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string }>()
    for (const e of monthExpenses) {
      const key = e.categories.id
      const existing = map.get(key)
      if (existing) {
        existing.value += Number(e.amount)
      } else {
        map.set(key, {
          name: e.categories.name,
          value: Number(e.amount),
          color: e.categories.color,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.value - a.value)
  }, [monthExpenses])

  // Daily spending for last 30 days
  const dailyData = useMemo(() => {
    const days = getDaysInMonth(currentMonth)
    const today = getDayOfMonth(new Date().toISOString())
    const arr: { day: string; amount: number }[] = []
    for (let d = 1; d <= days; d++) {
      const dateStr = `${currentMonth.substring(0, 8)}${String(d).padStart(2, '0')}`
      const dayTotal = monthExpenses
        .filter((e) => e.date === dateStr)
        .reduce((sum, e) => sum + Number(e.amount), 0)
      arr.push({
        day: d <= today ? String(d) : '',
        amount: dayTotal,
      })
    }
    return arr
  }, [monthExpenses, currentMonth])

  // Budget alerts
  const budgetAlerts = useMemo(() => {
    return budgets
      .map((b) => {
        const spent = monthExpenses
          .filter((e) => e.category_id === b.category_id)
          .reduce((sum, e) => sum + Number(e.amount), 0)
        return { ...b, spent, pct: (spent / Number(b.amount)) * 100 }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [budgets, monthExpenses])

  const overBudgetCount = budgetAlerts.filter((b) => b.pct > 100).length
  const nearBudgetCount = budgetAlerts.filter(
    (b) => b.pct >= 80 && b.pct <= 100,
  ).length

  const recentExpenses = expenses.slice(0, 5)

  const stats = [
    {
      label: 'Spent This Month',
      value: formatCurrency(totalThisMonth),
      icon: TrendingDown,
      color: 'error',
      bg: 'bg-error-50',
      text: 'text-error-600',
      subtext: `${monthExpenses.length} transactions`,
    },
    {
      label: 'Total Budget',
      value: formatCurrency(totalBudget),
      icon: Wallet,
      color: 'primary',
      bg: 'bg-primary-50',
      text: 'text-primary-600',
      subtext:
        totalBudget > 0
          ? `${formatCurrency(Math.max(0, totalBudget - totalThisMonth))} remaining`
          : 'No budgets set',
    },
    {
      label: 'Total Savings',
      value: formatCurrency(totalSavings),
      icon: PiggyBank,
      color: 'secondary',
      bg: 'bg-secondary-50',
      text: 'text-secondary-600',
      subtext:
        totalSavingsTarget > 0
          ? `${Math.round((totalSavings / totalSavingsTarget) * 100)}% of goal`
          : 'No goals set',
    },
    {
      label: 'Daily Average',
      value: formatCurrency(
        monthExpenses.length > 0
          ? totalThisMonth / Math.max(1, getDayOfMonth(new Date().toISOString()))
          : 0,
      ),
      icon: TrendingUp,
      color: 'accent',
      bg: 'bg-accent-50',
      text: 'text-accent-600',
      subtext: `${getDaysInMonth(currentMonth)} days this month`,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {getMonthName(currentMonth)}
          </p>
        </div>
        {overBudgetCount > 0 && (
          <div className="badge bg-error-50 text-error-700 border border-error-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            {overBudgetCount} budget{overBudgetCount > 1 ? 's' : ''} exceeded
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              className="card card-hover p-5 animate-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.text}`} strokeWidth={2} />
                </div>
              </div>
              <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
              <p className="font-display font-bold text-xl text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.subtext}</p>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '120ms' }}>
          <h3 className="font-display font-bold text-base text-slate-900 mb-1">
            Spending by Category
          </h3>
          <p className="text-xs text-slate-500 mb-4">Where your money went this month</p>
          {categoryData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={220} className="!w-[50%]">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 w-full max-h-[220px] overflow-y-auto">
                {categoryData.slice(0, 6).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm text-slate-600 flex-1 truncate">{cat.name}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(cat.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart message="No expenses yet this month" />
          )}
        </div>

        {/* Daily spending */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '180ms' }}>
          <h3 className="font-display font-bold text-base text-slate-900 mb-1">
            Daily Spending
          </h3>
          <p className="text-xs text-slate-500 mb-4">Your spending pattern this month</p>
          {monthExpenses.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label: string) => `Day ${label}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="amount" fill="#1b80f5" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No spending data yet" />
          )}
        </div>
      </div>

      {/* Budget overview + Recent expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget progress */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">Budget Progress</h3>
              <p className="text-xs text-slate-500 mt-0.5">How close you are to your limits</p>
            </div>
            <button
              onClick={() => onNavigate('budgets')}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {budgetAlerts.length > 0 ? (
            <div className="space-y-3">
              {budgetAlerts.slice(0, 4).map((b) => {
                const pct = Math.min(b.pct, 100)
                const isOver = b.pct > 100
                const isNear = b.pct >= 80 && b.pct <= 100
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">
                        {b.categories.name}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          isOver ? 'text-error-600' : isNear ? 'text-warning-600' : 'text-slate-500'
                        }`}
                      >
                        {formatCurrency(b.spent)} / {formatCurrency(Number(b.amount))}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isOver
                            ? 'bg-error-500'
                            : isNear
                              ? 'bg-warning-500'
                              : 'bg-primary-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-3">No budgets set for this month</p>
              <button onClick={() => onNavigate('budgets')} className="btn-primary text-xs">
                Set a Budget
              </button>
            </div>
          )}
        </div>

        {/* Recent expenses */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">Recent Expenses</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your latest transactions</p>
            </div>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="space-y-1">
              {recentExpenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${e.categories.color}15` }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: e.categories.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {e.description}
                    </p>
                    <p className="text-xs text-slate-400">
                      {e.categories.name} · {formatDate(e.date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 flex-shrink-0">
                    {formatCurrency(Number(e.amount))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-3">No expenses recorded yet</p>
              <button onClick={() => onNavigate('expenses')} className="btn-primary text-xs">
                Add Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Savings goals summary */}
      {savingsGoals.length > 0 && (
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '360ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">Savings Goals</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your saving progress</p>
            </div>
            <button
              onClick={() => onNavigate('savings')}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savingsGoals.slice(0, 3).map((g) => {
              const pct = Math.min(
                (Number(g.current_amount) / Number(g.target_amount)) * 100,
                100,
              )
              return (
                <div key={g.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-secondary-600" />
                    <span className="text-sm font-medium text-slate-800 truncate">{g.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    {formatCurrency(Number(g.current_amount))} of{' '}
                    {formatCurrency(Number(g.target_amount))}
                  </p>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-secondary-700 mt-1.5">{Math.round(pct)}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center">
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  )
}
