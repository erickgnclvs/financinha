'use client'

import { useMemo } from 'react'

interface InsightsProps {
    transactions: Record<string, unknown>[]
}

export default function MonthlyInsights({ transactions }: InsightsProps) {
    const insights = useMemo(() => {
        const now = new Date()
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

        const thisMonthTx = transactions.filter(t => {
            const d = new Date(String(t.data))
            return d >= currentMonthStart && t.direcao === 'SAIDA'
        })

        const lastMonthTx = transactions.filter(t => {
            const d = new Date(String(t.data))
            return d >= lastMonthStart && d <= lastMonthEnd && t.direcao === 'SAIDA'
        })

        // Top 3 categories this month
        const catTotals: Record<string, number> = {}
        thisMonthTx.forEach(t => {
            const cat = String(t.categoria || 'OUTROS')
            catTotals[cat] = (catTotals[cat] || 0) + Number(t.valor)
        })
        const topCategories = Object.entries(catTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name, value]) => ({ name, value }))

        // Total this month
        const totalThisMonth = thisMonthTx.reduce((s, t) => s + Number(t.valor), 0)

        // Category with biggest increase
        const lastCatTotals: Record<string, number> = {}
        lastMonthTx.forEach(t => {
            const cat = String(t.categoria || 'OUTROS')
            lastCatTotals[cat] = (lastCatTotals[cat] || 0) + Number(t.valor)
        })

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

        // Transaction count
        const txCount = thisMonthTx.length

        return {
            topCategories,
            totalThisMonth,
            biggestIncrease,
            dailyRate,
            daysLeft,
            txCount,
            dayOfMonth,
            daysInMonth,
        }
    }, [transactions])

    if (insights.txCount === 0) return null

    return (
        <div className="bg-white dark:bg-zinc-900/50 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-6 mb-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-lg">
                    💡
                </div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">Insights do Mês</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {/* Daily Rate */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Gasto médio diário</p>
                    <p className="text-2xl font-black text-zinc-800 dark:text-zinc-200">
                        R$ {insights.dailyRate.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                        {insights.daysLeft} dias restantes · {insights.txCount} transações
                    </p>
                </div>

                {/* Top categories */}
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

                {/* Biggest increase */}
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
        </div>
    )
}
