import type { View } from '../App'
import { LayoutDashboard, Receipt, Wallet, PiggyBank, TrendingDown } from 'lucide-react'

type NavItem = {
  id: View
  label: string
  icon: typeof LayoutDashboard
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'budgets', label: 'Budgets', icon: Wallet },
  { id: 'savings', label: 'Savings Goals', icon: PiggyBank },
]

export default function Sidebar({
  view,
  onNavigate,
  open,
  onClose,
}: {
  view: View
  onNavigate: (v: View) => void
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <TrendingDown className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-display font-bold text-slate-900 text-base leading-tight">
                  Paise Kahan Gaye
                </h1>
                <p className="text-xs text-slate-500 font-medium">Bhai?</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = view === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-slate-400'}`}
                    strokeWidth={2}
                  />
                  {item.label}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 animate-scale-in" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100">
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-4 border border-primary-100">
              <p className="text-xs font-medium text-slate-600">
                Track every rupee. Where did the money go, bhai?
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
