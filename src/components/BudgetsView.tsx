import { useState } from 'react'
import { Plus, Wallet, Trash2, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react'
import { supabase, type BudgetWithCategory, type Category, type ExpenseWithCategory } from '../lib/supabase'
import { formatCurrency, getCurrentMonthFirst, getMonthKey } from '../lib/format'
import { Modal } from './ExpensesView'

export default function BudgetsView({
  budgets,
  categories,
  monthExpenses,
  onRefresh,
}: {
  budgets: BudgetWithCategory[]
  categories: Category[]
  monthExpenses: ExpenseWithCategory[]
  onRefresh: () => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const currentMonth = getCurrentMonthFirst()

  const budgetData = budgets.map((b) => {
    const spent = monthExpenses
      .filter((e) => e.category_id === b.category_id && getMonthKey(e.date) === getMonthKey(currentMonth))
      .reduce((sum, e) => sum + Number(e.amount), 0)
    return {
      ...b,
      spent,
      remaining: Number(b.amount) - spent,
      pct: (spent / Number(b.amount)) * 100,
    }
  })

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent

  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id))
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900">Budgets</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date(currentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          disabled={availableCategories.length === 0}
          className="btn-primary disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Set Budget
        </button>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                <Wallet className="w-4.5 h-4.5 text-primary-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">Total Budget</span>
            </div>
            <p className="font-display font-bold text-xl text-slate-900">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="card p-5 animate-slide-up" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-error-50 flex items-center justify-center">
                <TrendingDown className="w-4.5 h-4.5 text-error-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">Spent</span>
            </div>
            <p className="font-display font-bold text-xl text-slate-900">{formatCurrency(totalSpent)}</p>
          </div>
          <div
            className={`card p-5 animate-slide-up ${totalRemaining < 0 ? 'border-error-200 bg-error-50/50' : ''}`}
            style={{ animationDelay: '120ms' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  totalRemaining < 0 ? 'bg-error-100' : 'bg-secondary-50'
                }`}
              >
                {totalRemaining < 0 ? (
                  <AlertTriangle className="w-4.5 h-4.5 text-error-600" />
                ) : (
                  <CheckCircle2 className="w-4.5 h-4.5 text-secondary-600" />
                )}
              </div>
              <span className="text-xs font-medium text-slate-500">
                {totalRemaining < 0 ? 'Over Budget' : 'Remaining'}
              </span>
            </div>
            <p
              className={`font-display font-bold text-xl ${
                totalRemaining < 0 ? 'text-error-700' : 'text-slate-900'
              }`}
            >
              {formatCurrency(Math.abs(totalRemaining))}
            </p>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgetData
            .sort((a, b) => b.pct - a.pct)
            .map((b, i) => (
              <BudgetCard key={b.id} budget={b} onRefresh={onRefresh} style={{ animationDelay: `${i * 60}ms` }} />
            ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Wallet className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="font-display font-bold text-lg text-slate-700 mb-2">No budgets set</h3>
          <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
            Set monthly spending limits for each category to keep your expenses in check.
          </p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Set Your First Budget
          </button>
        </div>
      )}

      {showAdd && availableCategories.length > 0 && (
        <AddBudgetModal
          categories={availableCategories}
          month={currentMonth}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            onRefresh()
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

function BudgetCard({
  budget,
  onRefresh,
  style,
}: {
  budget: BudgetWithCategory & { spent: number; remaining: number; pct: number }
  onRefresh: () => void
  style?: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(String(budget.amount))
  const [deleting, setDeleting] = useState(false)

  const isOver = budget.pct > 100
  const isNear = budget.pct >= 80 && budget.pct <= 100
  const pctCapped = Math.min(budget.pct, 100)

  const handleUpdate = async () => {
    const amt = parseFloat(editAmount)
    if (isNaN(amt) || amt <= 0) return
    await supabase.from('budgets').update({ amount: amt }).eq('id', budget.id)
    setEditing(false)
    onRefresh()
  }

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('budgets').delete().eq('id', budget.id)
    onRefresh()
  }

  return (
    <div
      className={`card p-5 animate-slide-up ${isOver ? 'border-error-200' : ''}`}
      style={style}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${budget.categories.color}18` }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: budget.categories.color }}
            />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-800">{budget.categories.name}</h4>
            <p className="text-xs text-slate-400">
              {formatCurrency(budget.spent)} of {formatCurrency(Number(budget.amount))}
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 rounded-lg text-slate-300 hover:text-error-600 hover:bg-error-50 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isOver ? 'bg-error-500' : isNear ? 'bg-warning-500' : 'bg-primary-500'
          }`}
          style={{ width: `${pctCapped}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span
          className={`font-semibold ${
            isOver ? 'text-error-600' : isNear ? 'text-warning-600' : 'text-slate-500'
          }`}
        >
          {Math.round(budget.pct)}% used
        </span>
        <span
          className={`font-medium ${
            budget.remaining < 0 ? 'text-error-600' : 'text-secondary-600'
          }`}
        >
          {budget.remaining < 0
            ? `${formatCurrency(Math.abs(budget.remaining))} over`
            : `${formatCurrency(budget.remaining)} left`}
        </span>
      </div>

      {editing ? (
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="input pl-8 text-sm"
              autoFocus
            />
          </div>
          <button onClick={handleUpdate} className="btn-primary text-xs px-3">
            Save
          </button>
          <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-3">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-slate-400 hover:text-primary-600 transition-colors mt-3 pt-3 border-t border-slate-100 w-full text-left"
        >
          Click to edit budget amount
        </button>
      )}
    </div>
  )
}

function AddBudgetModal({
  categories,
  month,
  onClose,
  onSaved,
}: {
  categories: Category[]
  month: string
  onClose: () => void
  onSaved: () => void
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!categoryId || !amount) {
      setError('Please fill in all fields')
      return
    }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setError('Amount must be greater than 0')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('budgets').insert({
      category_id: categoryId,
      amount: amt,
      month,
    })
    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title="Set Budget">
      <div className="space-y-4">
        <div>
          <label className="label">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Monthly Limit</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              ₹
            </span>
            <input
              type="number"
              step="100"
              placeholder="5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input pl-8 text-lg font-semibold"
              autoFocus
            />
          </div>
        </div>
        {error && (
          <div className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Set Budget'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
