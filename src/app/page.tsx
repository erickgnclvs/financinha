import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AIChatButton from '@/components/AIChatButton'
import DashboardCharts from '@/components/DashboardCharts'
import Header from '@/components/Header'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch transactions here
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('data', { ascending: false })

  // Calculate balance
  const balance = (transactions || []).reduce((acc, t) => {
    if (t.direcao === 'ENTRADA') return acc + Number(t.valor)
    if (t.direcao === 'SAIDA') return acc - Number(t.valor)
    return acc // INFO
  }, 0)

  // Get only recent 10 for the list
  const recentTransactions = (transactions || []).slice(0, 10)

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/30">
      <Header />

      {/* Hero Section with Glassmorphism and vibrant gradient */}
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
                <div className="flex-1 sm:min-w-[120px] bg-white/10 rounded-2xl p-4 min-w-[120px]">
                  <p className="text-xs text-indigo-100 uppercase font-semibold mb-1">Entradas</p>
                  <p className="text-lg font-bold text-emerald-400">+ R$ {(transactions || []).filter(t => t.direcao === 'ENTRADA').reduce((sum, t) => sum + Number(t.valor), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex-1 sm:min-w-[120px] bg-white/10 rounded-2xl p-4 min-w-[120px]">
                  <p className="text-xs text-indigo-100 uppercase font-semibold mb-1">Saídas</p>
                  <p className="text-lg font-bold text-rose-300">- R$ {(transactions || []).filter(t => t.direcao === 'SAIDA').reduce((sum, t) => sum + Number(t.valor), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 mt-8 max-w-5xl mx-auto w-full pb-24">
        <DashboardCharts transactions={transactions || []} />

        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-lg font-bold">Transações Recentes</h3>
          <button className="text-blue-600 dark:text-blue-400 text-sm font-semibold">Ver todas</button>
        </div>

        {recentTransactions?.length ? (
          <div className="grid gap-3">
            {recentTransactions.map((t) => (
              <div key={t.id} className="group relative bg-white dark:bg-zinc-900/50 p-5 rounded-2xl shadow-sm hover:shadow-md border border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center transition-all duration-300 hover:-translate-y-0.5">
                <div className={`absolute inset-y-0 left-0 w-1.5 rounded-l-2xl ${t.direcao === 'SAIDA' ? 'bg-rose-500' : t.direcao === 'ENTRADA' ? 'bg-emerald-500' : 'bg-zinc-400'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.direcao === 'SAIDA' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : t.direcao === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                    {t.direcao === 'SAIDA' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-9-9-9 9" /></svg>
                    ) : t.direcao === 'ENTRADA' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 9 9 9-9" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-base text-zinc-800 dark:text-zinc-200 truncate">{t.descricao}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 font-medium truncate">
                      <span>{new Date(t.data).toLocaleDateString('pt-BR')}</span>
                      {t.categoria && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                          <span className="capitalize">{t.categoria}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`text-lg font-black tracking-tight whitespace-nowrap pl-2 ${t.direcao === 'SAIDA' ? 'text-rose-600 dark:text-rose-500' : t.direcao === 'ENTRADA' ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-500'}`}>
                  {t.direcao === 'SAIDA' ? '-' : t.direcao === 'ENTRADA' ? '+' : ''}R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-500 text-sm font-medium">
            Nenhuma transação encontrada.
          </div>
        )}
      </main>

      {/* Floating Action Button for AI input */}
      <AIChatButton />
    </div>
  )
}
