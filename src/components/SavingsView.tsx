import { useState } from 'react'
import {
  Plus,
  PiggyBank,
  Trash2,
  Target,
  TrendingUp,
  Minus,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { supabase, type SavingsGoal } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/format'
import { Modal } from './ExpensesView'

export default function SavingsView({
  savingsGoals,
  onRefresh,
}: {
  savingsGoals: SavingsGoal[]
  onRefresh: () => void
}) {
  const [showAdd, setShowAdd] = useState(false)

  const totalSaved = savingsGoals.reduce((sum, g) => sum + Number(g.current_amount), 0)
  const totalTarget = savingsGoals.reduce((sum, g) => sum + Number(g.target_amount), 0)
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900">Savings Goals</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {savingsGoals.length} goal{savingsGoals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Overall progress */}
      {savingsGoals.length > 0 && (
        <div className="card p-6 bg-gradient-to-br from-secondary-50 to-primary-50/50 border-secondary-100 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Total Savings Progress</p>
              <p className="font-display font-bold text-2xl text-slate-900">
                {formatCurrency(totalSaved)}{' '}
                <span className="text-sm font-medium text-slate-400">
                  / {formatCurrency(totalTarget)}
                </span>
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-secondary-600" />
            </div>
          </div>
          <div className="h-3 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>
          <p className="text-xs font-semibold text-secondary-700 mt-2">
            {Math.round(overallPct)}% of all goals funded
          </p>
        </div>
      )}

      {/* Goal cards */}
      {savingsGoals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsGoals.map((g, i) => (
            <SavingsGoalCard
              key={g.id}
              goal={g}
              onRefresh={onRefresh}
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <PiggyBank className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="font-display font-bold text-lg text-slate-700 mb-2">No savings goals yet</h3>
          <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
            Set a savings target — a vacation, an emergency fund, or that gadget you've been eyeing.
          </p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Your First Goal
          </button>
        </div>
      )}

      {showAdd && (
        <AddGoalModal
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

function SavingsGoalCard({
  goal,
  onRefresh,
  style,
}: {
  goal: SavingsGoal
  onRefresh: () => void
  style?: React.CSSProperties
}) {
  const [showContribute, setShowContribute] = useState(false)
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const target = Number(goal.target_amount)
  const current = Number(goal.current_amount)
  const pct = Math.min((current / target) * 100, 100)
  const remaining = Math.max(0, target - current)
  const isComplete = current >= target

  const handleContribute = async (isAdd: boolean) => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return
    setSaving(true)
    const newAmount = isAdd ? current + amt : Math.max(0, current - amt)
    await supabase
      .from('savings_goals')
      .update({ current_amount: newAmount })
      .eq('id', goal.id)
    setSaving(false)
    setAmount('')
    setShowContribute(false)
    onRefresh()
  }

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('savings_goals').delete().eq('id', goal.id)
    onRefresh()
  }

  return (
    <div
      className={`card p-5 animate-slide-up relative overflow-hidden ${
        isComplete ? 'border-secondary-200 bg-secondary-50/30' : ''
      }`}
      style={style}
    >
      {isComplete && (
        <div className="absolute top-3 right-3 badge bg-secondary-100 text-secondary-700">
          <CheckCircle2 className="w-3.5 h-3.5" /> Goal Reached!
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center shadow-sm shadow-secondary-500/20">
          <Target className="w-5.5 h-5.5 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-slate-800 truncate">{goal.name}</h4>
          {goal.target_date && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(goal.target_date)}
            </p>
          )}
        </div>
        {!isComplete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-lg text-slate-300 hover:text-error-600 hover:bg-error-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="font-display font-bold text-2xl text-slate-900 mb-1">
        {formatCurrency(current)}
      </p>
      <p className="text-xs text-slate-400 mb-3">
        of {formatCurrency(target)} · {Math.round(pct)}%
      </p>

      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {!isComplete && (
        <p className="text-xs text-slate-500 mb-3">
          {formatCurrency(remaining)} left to save
        </p>
      )}

      {showContribute ? (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              ₹
            </span>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input pl-8 text-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleContribute(true)}
              disabled={saving}
              className="btn-primary text-xs flex-1 py-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
            <button
              onClick={() => handleContribute(false)}
              disabled={saving}
              className="btn-secondary text-xs flex-1 py-2"
            >
              <Minus className="w-3.5 h-3.5" /> Withdraw
            </button>
            <button
              onClick={() => setShowContribute(false)}
              className="btn-secondary text-xs px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        !isComplete && (
          <button
            onClick={() => setShowContribute(true)}
            className="text-xs font-medium text-secondary-600 hover:text-secondary-700 transition-colors pt-2 border-t border-slate-100 w-full text-left"
          >
            Add money to this goal
          </button>
        )
      )}
    </div>
  )
}

function AddGoalModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim() || !targetAmount) {
      setError('Please enter a name and target amount')
      return
    }
    const target = parseFloat(targetAmount)
    if (isNaN(target) || target <= 0) {
      setError('Target amount must be greater than 0')
      return
    }
    const current = currentAmount ? parseFloat(currentAmount) : 0
    if (isNaN(current) || current < 0) {
      setError('Current amount cannot be negative')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('savings_goals').insert({
      name: name.trim(),
      target_amount: target,
      current_amount: current,
      target_date: targetDate || null,
    })
    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }
    onSaved()
  }

  return (
    <Modal onClose={onClose} title="New Savings Goal">
      <div className="space-y-4">
        <div>
          <label className="label">Goal Name</label>
          <input
            type="text"
            placeholder="e.g. Vacation Fund, Emergency Fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Target Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              ₹
            </span>
            <input
              type="number"
              placeholder="50000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="input pl-8 text-lg font-semibold"
            />
          </div>
        </div>
        <div>
          <label className="label">Already Saved (Optional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              ₹
            </span>
            <input
              type="number"
              placeholder="0"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="input pl-8"
            />
          </div>
        </div>
        <div>
          <label className="label">Target Date (Optional)</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
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
            {saving ? 'Saving...' : 'Create Goal'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
