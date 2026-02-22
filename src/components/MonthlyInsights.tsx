'use client'

import { useMemo, useState } from 'react'

interface InsightsProps {
    transactions: Record<string, unknown>[]
}

export default function MonthlyInsights({ transactions }: InsightsProps) {
    const [showModal, setShowModal] = useState(false)

    const insights = useMemo(() => {
        const now = new Date()
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

        const allExpenses = transactions.filter(t => t.direcao === 'SAIDA')
        const allIncome = transactions.filter(t => t.direcao === 'ENTRADA')

        const thisMonthExpenses = allExpenses.filter(t => new Date(String(t.data)) >= currentMonthStart)
        const lastMonthExpenses = allExpenses.filter(t => {
            const d = new Date(String(t.data))
            return d >= lastMonthStart && d <= lastMonthEnd
        })

        const thisMonthIncome = allIncome.filter(t => new Date(String(t.data)) >= currentMonthStart)
            .reduce((s, t) => s + Number(t.valor), 0)

        // Category totals — this month
        const catTotals: Record<string, number> = {}
        thisMonthExpenses.forEach(t => {
            const cat = String(t.categoria || 'OUTROS')
            catTotals[cat] = (catTotals[cat] || 0) + Number(t.valor)
        })

        // Category totals — last month
        const lastCatTotals: Record<string, number> = {}
        lastMonthExpenses.forEach(t => {
            const cat = String(t.categoria || 'OUTROS')
            lastCatTotals[cat] = (lastCatTotals[cat] || 0) + Number(t.valor)
        })

        // All categories sorted
        const allCategories = Object.entries(catTotals)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value]) => ({
                name,
                value,
                lastMonth: lastCatTotals[name] || 0,
                change: lastCatTotals[name] ? Math.round(((value - lastCatTotals[name]) / lastCatTotals[name]) * 100) : null,
            }))

        const topCategories = allCategories.slice(0, 3)
        const totalThisMonth = thisMonthExpenses.reduce((s, t) => s + Number(t.valor), 0)
        const totalLastMonth = lastMonthExpenses.reduce((s, t) => s + Number(t.valor), 0)

        // Biggest increase
        let biggestIncrease: { name: string; increase: number; current: number } | null = null
        for (const [cat, val] of Object.entries(catTotals)) {
            const prev = lastCatTotals[cat] || 0
            const increase = prev > 0 ? ((val - prev) / prev) * 100 : 0
            if (increase > 0 && (!biggestIncrease || increase > biggestIncrease.increase)) {
                biggestIncrease = { name: cat, increase: Math.round(increase), current: val }
            }
        }

        // Daily rate
        const dayOfMonth = now.getDate()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const daysLeft = daysInMonth - dayOfMonth
        const dailyRate = dayOfMonth > 0 ? totalThisMonth / dayOfMonth : 0

        // Savings rate
        const savingsRate = thisMonthIncome > 0 ? Math.round(((thisMonthIncome - totalThisMonth) / thisMonthIncome) * 100) : 0

        // Biggest single transaction
        const biggestTx = thisMonthExpenses.length > 0
            ? thisMonthExpenses.reduce((max, t) => Number(t.valor) > Number(max.valor) ? t : max, thisMonthExpenses[0])
            : null

        // Daily spending last 14 days
        const dailySpending: { day: string; value: number }[] = []
        for (let i = 13; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            const dayTotal = allExpenses
                .filter(t => String(t.data) === dateStr)
                .reduce((s, t) => s + Number(t.valor), 0)
            dailySpending.push({
                day: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                value: dayTotal,
            })
        }

        const txCount = thisMonthExpenses.length

        return {
            topCategories,
            allCategories,
            totalThisMonth,
            totalLastMonth,
            biggestIncrease,
            dailyRate,
            daysLeft,
            txCount,
            dayOfMonth,
            daysInMonth,
            savingsRate,
            thisMonthIncome,
            biggestTx,
            dailySpending,
        }
    }, [transactions])

    if (insights.txCount === 0) return null

    const maxDaily = Math.max(...insights.dailySpending.map(d => d.value), 1)

    return (
        <>
            {/* Compact Widget — clickable */}
            <button
                onClick={() => setShowModal(true)}
                className="w-full text-left bg-white dark:bg-zinc-900/50 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-6 mb-8 backdrop-blur-xl hover:shadow-md transition-all group cursor-pointer"
            >
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-lg">
                            💡
                        </div>
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">Insights do Mês</h3>
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Expandir →</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Gasto médio diário</p>
                        <p className="text-2xl font-black text-zinc-800 dark:text-zinc-200">
                            R$ {insights.dailyRate.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                            {insights.daysLeft} dias restantes · {insights.txCount} transações
                        </p>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Onde mais gasta</p>
                        <div className="flex flex-col gap-2">
                            {insights.topCategories.map((cat, i) => (
                                <div key={cat.name} className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {cat.name.toLowerCase()}
                                    </span>
                                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                        R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {insights.biggestIncrease && (
                        <div className="bg-rose-50 dark:bg-rose-500/10 rounded-2xl p-4 sm:col-span-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">⚠️</span>
                                <div>
                                    <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
                                        <span className="capitalize">{insights.biggestIncrease.name.toLowerCase()}</span> subiu {insights.biggestIncrease.increase}% vs mês passado
                                    </p>
                                    <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-0.5">
                                        R$ {insights.biggestIncrease.current.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} este mês
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </button>

            {/* Expanded Insights Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
                >
                    <div className="bg-zinc-50 dark:bg-zinc-950 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="font-bold text-xl">📊 Insights Completos</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/50">
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Gastos</p>
                                    <p className="text-xl font-black text-rose-600 dark:text-rose-500">
                                        R$ {insights.totalThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    {insights.totalLastMonth > 0 && (
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {insights.totalThisMonth > insights.totalLastMonth ? '↑' : '↓'} vs R$ {insights.totalLastMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mês passado
                                        </p>
                                    )}
                                </div>
                                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/50">
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Taxa de Poupança</p>
                                    <p className={`text-xl font-black ${insights.savingsRate >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                        {insights.savingsRate}%
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        {insights.savingsRate >= 20 ? '🎉 Ótimo!' : insights.savingsRate >= 0 ? '⚠️ Poderia ser melhor' : '🚨 Gastando mais que ganha'}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/50">
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Média Diária</p>
                                    <p className="text-xl font-black text-zinc-800 dark:text-zinc-200">
                                        R$ {insights.dailyRate.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">{insights.daysLeft} dias restantes</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/50">
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Transações</p>
                                    <p className="text-xl font-black text-zinc-800 dark:text-zinc-200">{insights.txCount}</p>
                                    <p className="text-xs text-zinc-500 mt-1">Dia {insights.dayOfMonth} de {insights.daysInMonth}</p>
                                </div>
                            </div>

                            {/* Daily Spending Mini Chart */}
                            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/50">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Gastos dos últimos 14 dias</p>
                                <div className="flex items-end justify-between gap-1 h-24">
                                    {insights.dailySpending.map((d, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <div
                                                className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-sm min-h-[2px] transition-all"
                                                style={{ height: `${Math.max((d.value / maxDaily) * 100, 2)}%` }}
                                                title={`${d.day}: R$ ${d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                            ></div>
                                            {i % 2 === 0 && (
                                                <span className="text-[9px] text-zinc-400 font-medium">{d.day}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Full Category Breakdown */}
                            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/50">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Todas as Categorias</p>
                                <div className="flex flex-col gap-3">
                                    {insights.allCategories.map((cat) => {
                                        const maxCat = insights.allCategories[0]?.value || 1
                                        const barWidth = (cat.value / maxCat) * 100
                                        return (
                                            <div key={cat.name}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 capitalize">{cat.name.toLowerCase()}</span>
                                                    <div className="flex items-center gap-2">
                                                        {cat.change !== null && (
                                                            <span className={`text-xs font-bold ${cat.change > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                                {cat.change > 0 ? '↑' : '↓'}{Math.abs(cat.change)}%
                                                            </span>
                                                        )}
                                                        <span className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                                                            R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                                                        style={{ width: `${barWidth}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Biggest Transaction */}
                            {insights.biggestTx && (
                                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-500/20">
                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">💸 Maior gasto do mês</p>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{String(insights.biggestTx.descricao)}</span>
                                        <span className="font-black text-rose-600 dark:text-rose-500">
                                            R$ {Number(insights.biggestTx.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1 capitalize">
                                        {String(insights.biggestTx.categoria || '').toLowerCase()} · {new Date(String(insights.biggestTx.data)).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
