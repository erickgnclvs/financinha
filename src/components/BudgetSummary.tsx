'use client'

import Link from 'next/link'

interface Budget {
    id: string
    categoria: string
    limite: number
}

const CATEGORY_EMOJI: Record<string, string> = {
    CARRO: '🚗', MERCADO: '🛒', 'RESTAURANTE/IFOOD': '🍕', SAUDE: '💊',
    LAZER: '🎮', ALUGUEL: '🏠', CONTAS: '📄', BELEZA: '💅',
    'ROUPAS/CALÇADO': '👟', INVESTIMENTO: '📈', 'DESENVOLVIMENTO PESSOAL': '📚',
    'DESPESAS EVENTUAIS': '🔧',
}

interface BudgetSummaryProps {
    budgets: Budget[]
    transactions: Record<string, unknown>[]
}

export default function BudgetSummary({ budgets, transactions }: BudgetSummaryProps) {
    if (!budgets.length) return null

    // Calculate spending per category
    const spending: Record<string, number> = {}
    transactions.forEach(t => {
        if (t.direcao === 'SAIDA') {
            const cat = String(t.categoria || '').toUpperCase()
            spending[cat] = (spending[cat] || 0) + Number(t.valor)
        }
    })

    // Only show budgets that are >50% used or over budget
    const activeBudgets = budgets
        .map(b => {
            const spent = spending[b.categoria.toUpperCase()] || 0
            const percent = b.limite > 0 ? (spent / b.limite) * 100 : 0
            return { ...b, spent, percent }
        })
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 4)

    if (!activeBudgets.length) return null

    return (
        <div className="bg-white dark:bg-zinc-900/50 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-6 mb-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-lg">
                        📊
                    </div>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">Orçamentos</h3>
                </div>
                <Link href="/budgets" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                    Ver todos →
                </Link>
            </div>

            <div className="flex flex-col gap-3">
                {activeBudgets.map(b => {
                    const isOver = b.percent > 100
                    const isWarning = b.percent > 75
                    const emoji = CATEGORY_EMOJI[b.categoria.toUpperCase()] || '💰'

                    return (
                        <div key={b.id} className="flex items-center gap-3">
                            <span className="text-base w-6 text-center flex-shrink-0">{emoji}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 capitalize truncate">{b.categoria.toLowerCase()}</span>
                                    <span className={`text-xs font-bold ${isOver ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>
                                        {Math.round(b.percent)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${isOver
                                            ? 'bg-gradient-to-r from-red-500 to-rose-500'
                                            : isWarning
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                            }`}
                                        style={{ width: `${Math.min(b.percent, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
