'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']

export default function DashboardCharts({ transactions }: { transactions: Record<string, unknown>[] }) {
    const expensesByCategory = useMemo(() => {
        const expenses = transactions.filter(t => t.direcao === 'SAIDA')

        const categoryTotals = expenses.reduce<Record<string, number>>((acc, t) => {
            const cat = String(t.categoria || 'Outros')
            acc[cat] = (acc[cat] || 0) + (Number(t.valor) || 0)
            return acc
        }, {})

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value: Number(value) }))
            .sort((a, b) => Number(b.value) - Number(a.value))
    }, [transactions])

    if (!expensesByCategory.length) {
        return null
    }

    return (
        <div className="bg-white dark:bg-zinc-900/50 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-6 mb-8 mt-4 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">Despesas por Categoria</h3>
            </div>

            <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={expensesByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={100}
                            paddingAngle={7}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={8}
                        >
                            {expensesByCategory.map((entry, index) => (
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
                        <Legend
                            verticalAlign="bottom"
                            height={80}
                            iconType="circle"
                            formatter={(value) => <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 capitalize ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
