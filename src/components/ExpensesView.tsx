import { useState, useMemo } from 'react'
import { Plus, Search, Trash2, Receipt, Filter, X, Tag } from 'lucide-react'
import { supabase, type ExpenseWithCategory, type Category } from '../lib/supabase'
import { formatCurrency, formatDate, getMonthKey, getCurrentMonthFirst } from '../lib/format'

export default function ExpensesView({
  expenses,
  categories,
  loading,
  onRefresh,
  onCategoriesChange,
}: {
  expenses: ExpenseWithCategory[]
  categories: Category[]
  loading: boolean
  onRefresh: () => void
  onCategoriesChange: (cats: Category[]) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [showAddCategory, setShowAddCategory] = useState(false)

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCat !== 'all' && e.category_id !== filterCat) return false
      if (filterMonth !== 'all' && getMonthKey(e.date) !== filterMonth) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !e.description.toLowerCase().includes(q) &&
          !e.categories.name.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [expenses, search, filterCat, filterMonth])

  const totalFiltered = filtered.reduce((sum, e) => sum + Number(e.amount), 0)

  const monthOptions = useMemo(() => {
    const months = new Set<string>()
    expenses.forEach((e) => months.add(getMonthKey(e.date)))
    months.add(getMonthKey(getCurrentMonthFirst()))
    return Array.from(months).sort().reverse()
  }, [expenses])

  const hasFilters = search || filterCat !== 'all' || filterMonth !== 'all'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900">Expenses</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} ·{' '}
            {formatCurrency(totalFiltered)}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddCategory(true)} className="btn-secondary">
            <Tag className="w-4 h-4" /> Category
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="input sm:w-44"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="input sm:w-36"
          >
            <option value="all">All Months</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {new Date(m + '-01').toLocaleDateString('en-IN', {
                  month: 'long',
                  year: 'numeric',
                })}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch('')
                setFilterCat('all')
                setFilterMonth('all')
              }}
              className="btn-secondary"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((e, i) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                onDelete={onRefresh}
                style={{ animationDelay: `${i * 30}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            {hasFilters ? (
              <>
                <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No expenses match your filters</p>
              </>
            ) : (
              <>
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">
                  No expenses yet. Start tracking where your money goes!
                </p>
                <button onClick={() => setShowAdd(true)} className="btn-primary">
                  <Plus className="w-4 h-4" /> Add Your First Expense
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <AddExpenseModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            onRefresh()
            setShowAdd(false)
          }}
        />
      )}

      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onSaved={(newCat) => {
            onCategoriesChange([...categories, newCat])
            setShowAddCategory(false)
          }}
        />
      )}
    </div>
  )
}

function ExpenseRow({
  expense,
  onDelete,
  style,
}: {
  expense: ExpenseWithCategory
  onDelete: () => void
  style?: React.CSSProperties
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('expenses').delete().eq('id', expense.id)
    if (error) {
      console.error('Error deleting:', error)
      setDeleting(false)
      return
    }
    onDelete()
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors animate-fade-in group"
      style={style}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${expense.categories.color}18` }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: expense.categories.color }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{expense.description}</p>
        <p className="text-xs text-slate-400">
          {expense.categories.name} · {formatDate(expense.date)}
        </p>
      </div>
      <span className="text-sm font-semibold text-slate-900 flex-shrink-0">
        {formatCurrency(Number(expense.amount))}
      </span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-2 rounded-lg text-slate-300 hover:text-error-600 hover:bg-error-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

function AddExpenseModal({
  categories,
  onClose,
  onSaved,
}: {
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!amount || !description || !categoryId) {
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
    const { error: insertError } = await supabase.from('expenses').insert({
      amount: amt,
      description: description.trim(),
      category_id: categoryId,
      date,
    })
    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title="Add Expense">
      <div className="space-y-4">
        <div>
          <label className="label">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input pl-8 text-lg font-semibold"
              autoFocus
            />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input
            type="text"
            placeholder="What did you spend on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
          />
        </div>
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
          <label className="label">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
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
            {saving ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function AddCategoryModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (cat: Category) => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#1b80f5')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const colors = [
    '#1b80f5', '#10b981', '#f97316', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#eab308', '#06b6d4', '#6b7280',
  ]

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a category name')
      return
    }
    setSaving(true)
    setError(null)
    const { data, error: insertError } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        color,
        icon: 'Wallet',
        is_default: false,
      })
      .select()
      .single()
    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }
    onSaved(data as Category)
  }

  return (
    <Modal onClose={onClose} title="Add Category">
      <div className="space-y-4">
        <div>
          <label className="label">Category Name</label>
          <input
            type="text"
            placeholder="e.g. Pet Care, Rent, Gifts"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Color</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-xl transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
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
            {saving ? 'Saving...' : 'Add Category'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <h3 className="font-display font-bold text-lg text-slate-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}
