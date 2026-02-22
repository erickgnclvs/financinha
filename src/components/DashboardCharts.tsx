'use client'

import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#0ea5e9', '#f97316', '#14b8a6', '#e11d48', '#a855f7']

const FIXED_EXPENSE_CATEGORIES = ['CONTAS', 'ALUGUEL']

export default function DashboardCharts({ transactions }: { transactions: Record<string, unknown>[] }) {
    const [hideFixed, setHideFixed] = useState(false)

    const { allExpenses, filteredExpenses, fixedTotal } = useMemo(() => {
        const expenses = transactions.filter(t => t.direcao === 'SAIDA')

        const categoryTotals = expenses.reduce<Record<string, number>>((acc, t) => {
            const cat = String(t.categoria || 'OUTROS')
            acc[cat] = (acc[cat] || 0) + (Number(t.valor) || 0)
            return acc
        }, {})

        const all = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value: Number(value) }))
            .sort((a, b) => Number(b.value) - Number(a.value))

        const fixed = all
            .filter(e => FIXED_EXPENSE_CATEGORIES.includes(e.name.toUpperCase()))
            .reduce((s, e) => s + e.value, 0)

        const filtered = all.filter(e => !FIXED_EXPENSE_CATEGORIES.includes(e.name.toUpperCase()))

        return { allExpenses: all, filteredExpenses: filtered, fixedTotal: fixed }
    }, [transactions])

    const displayData = hideFixed ? filteredExpenses : allExpenses

    if (!allExpenses.length) {
        return null
    }

    return (
        <div className="bg-white dark:bg-zinc-900/50 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-6 mb-8 mt-4 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">Despesas por Categoria</h3>
                </div>

                {/* Toggle for fixed expenses */}
                <button
                    onClick={() => setHideFixed(!hideFixed)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${hideFixed
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-500/30'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                >
                    {hideFixed ? '🏠 Fixas ocultas' : '👁 Ocultar fixas'}
                </button>
            </div>

            {/* Fixed expenses info bar */}
            {hideFixed && fixedTotal > 0 && (
                <div className="mb-4 px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <span>📌</span>
                    <span>Contas fixas (Contas + Aluguel) ocultas: <strong>R$ {fixedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                </div>
            )}

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={displayData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={7}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={8}
                        >
                            {displayData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <RechartsTooltip
                            formatter={(value: any) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            contentStyle={{
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(12px)',
                                fontWeight: 600
                            }}
                            itemStyle={{ color: '#18181b' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
                {displayData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 capitalize">{entry.name.toLowerCase()}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
