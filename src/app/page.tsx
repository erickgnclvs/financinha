import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AIChatButton from '@/components/AIChatButton'
import DashboardCharts from '@/components/DashboardCharts'
import MonthlyInsights from '@/components/MonthlyInsights'
import Header from '@/components/Header'
import TransactionList from '@/components/TransactionList'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('data', { ascending: false })

  const allTx = transactions || []

  // Current month boundaries
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const thisMonthTx = allTx.filter(t => new Date(t.data) >= currentMonthStart)
  const lastMonthTx = allTx.filter(t => {
    const d = new Date(t.data)
    return d >= lastMonthStart && d <= lastMonthEnd
  })

  // Calculate balance (all-time)
  const balance = allTx.reduce((acc, t) => {
    if (t.direcao === 'ENTRADA') return acc + Number(t.valor)
    if (t.direcao === 'SAIDA') return acc - Number(t.valor)
    return acc
  }, 0)

  // Monthly totals
  const monthIncome = thisMonthTx.filter(t => t.direcao === 'ENTRADA').reduce((s, t) => s + Number(t.valor), 0)
  const monthExpense = thisMonthTx.filter(t => t.direcao === 'SAIDA').reduce((s, t) => s + Number(t.valor), 0)
  const lastMonthExpense = lastMonthTx.filter(t => t.direcao === 'SAIDA').reduce((s, t) => s + Number(t.valor), 0)

  // Spending pace
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dailyPace = dayOfMonth > 0 ? monthExpense / dayOfMonth : 0
  const projectedMonthEnd = dailyPace * daysInMonth
  const paceVsLast = lastMonthExpense > 0
    ? Math.round(((projectedMonthEnd - lastMonthExpense) / lastMonthExpense) * 100)
    : 0

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/30">
      <Header />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white rounded-b-[2.5rem] shadow-xl pb-12 pt-24 px-6 z-10">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-sky-400 opacity-20 blur-3xl"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <p className="opacity-90 font-medium text-indigo-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Bem-vindo(a) de volta!
          </p>

          <div className="mt-8 relative group">
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-3xl opacity-50 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>

              <div>
                <p className="text-sm font-semibold text-indigo-100 uppercase tracking-[0.2em] mb-2">Saldo Atual</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-medium text-indigo-100">R$</span>
                  <h2 className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-sm">
                    {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
              </div>

              <div className="flex w-full sm:w-auto gap-4">
                <div className="flex-1 bg-white/10 rounded-2xl p-4 min-w-[120px]">
                  <p className="text-xs text-indigo-100 uppercase font-semibold mb-1">Entradas (mês)</p>
                  <p className="text-lg font-bold text-emerald-400">+ R$ {monthIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex-1 bg-white/10 rounded-2xl p-4 min-w-[120px]">
                  <p className="text-xs text-indigo-100 uppercase font-semibold mb-1">Saídas (mês)</p>
                  <p className="text-lg font-bold text-rose-300">- R$ {monthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Spending Pace Indicator */}
          {lastMonthExpense > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-100/80 font-medium bg-white/5 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <span>{paceVsLast > 0 ? '📈' : '📉'}</span>
              <span>
                Ritmo de gastos {paceVsLast > 0 ? `${paceVsLast}% acima` : `${Math.abs(paceVsLast)}% abaixo`} do mês passado
                {' · '}
                Projeção: R$ {projectedMonthEnd.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 px-4 mt-8 max-w-5xl mx-auto w-full pb-24">
        <DashboardCharts transactions={allTx} />
        <MonthlyInsights transactions={allTx} />
        <TransactionList transactions={allTx} showAllLink={true} limit={15} />
      </main>

      {/* Floating Action Button for AI input */}
      <AIChatButton />
    </div>
  )
}
