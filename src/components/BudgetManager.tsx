'use client'

import { useState } from 'react'
import { createBudget, deleteBudget } from '@/app/budgets/actions'
import { useRouter } from 'next/navigation'

const CATEGORY_OPTIONS = [
    'CARRO', 'MERCADO', 'RESTAURANTE/IFOOD', 'SAUDE', 'LAZER',
    'ALUGUEL', 'CONTAS', 'BELEZA', 'ROUPAS/CALÇADO', 'INVESTIMENTO',
    'DESENVOLVIMENTO PESSOAL', 'DESPESAS EVENTUAIS',
]

const CATEGORY_EMOJI: Record<string, string> = {
    CARRO: '🚗', MERCADO: '🛒', 'RESTAURANTE/IFOOD': '🍕', SAUDE: '💊',
    LAZER: '🎮', ALUGUEL: '🏠', CONTAS: '📄', BELEZA: '💅',
    'ROUPAS/CALÇADO': '👟', INVESTIMENTO: '📈', 'DESENVOLVIMENTO PESSOAL': '📚',
    'DESPESAS EVENTUAIS': '🔧',
}

interface Budget {
    id: string
    categoria: string
    limite: number
    ativo: boolean
}

interface BudgetManagerProps {
    budgets: Budget[]
    transactions: Record<string, unknown>[]
}

export default function BudgetManager({ budgets, transactions }: BudgetManagerProps) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [categoria, setCategoria] = useState('')
    const [limite, setLimite] = useState('')
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Calculate spending per category for this month
    const categorySpending: Record<string, number> = {}
    transactions.forEach(t => {
        const cat = String(t.categoria || '').toUpperCase()
        categorySpending[cat] = (categorySpending[cat] || 0) + Number(t.valor)
    })

    const handleCreate = async () => {
        if (!categoria || !limite) return
        setSaving(true)
        try {
            await createBudget({ categoria, limite: parseFloat(limite) })
            setCategoria('')
            setLimite('')
            setShowForm(false)
            router.refresh()
        } catch (e) {
            console.error(e)
            alert('Erro ao criar orçamento')
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            await deleteBudget(id)
            router.refresh()
        } catch (e) {
            console.error(e)
            alert('Erro ao remover orçamento')
        }
        setDeletingId(null)
    }

    // Categories not yet budgeted
    const budgetedCategories = budgets.map(b => b.categoria.toUpperCase())
    const availableCategories = CATEGORY_OPTIONS.filter(c => !budgetedCategories.includes(c))

    return (
        <div className="flex flex-col gap-4">
            {/* Budget cards */}
            {budgets.length > 0 ? (
                budgets.map(budget => {
                    const spent = categorySpending[budget.categoria.toUpperCase()] || 0
                    const percent = budget.limite > 0 ? Math.min((spent / budget.limite) * 100, 100) : 0
                    const remaining = budget.limite - spent
                    const isOver = remaining < 0
                    const emoji = CATEGORY_EMOJI[budget.categoria.toUpperCase()] || '💰'

                    return (
                        <div key={budget.id} className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-5 backdrop-blur-xl">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{emoji}</span>
                                    <div>
                                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 capitalize">{budget.categoria.toLowerCase()}</h4>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            Limite: R$ {budget.limite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(budget.id)}
                                    disabled={deletingId === budget.id}
                                    className="text-xs text-zinc-400 hover:text-red-500 transition-colors p-1"
                                >
                                    {deletingId === budget.id ? '...' : '✕'}
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isOver
                                        ? 'bg-gradient-to-r from-red-500 to-rose-500'
                                        : percent > 75
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                        }`}
                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between items-center text-xs font-medium">
                                <span className="text-zinc-500">
                                    R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} gasto
                                </span>
                                <span className={`font-bold ${isOver ? 'text-red-600 dark:text-red-400' : percent > 75 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {isOver
                                        ? `R$ ${Math.abs(remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acima`
                                        : `R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} restante`
                                    }
                                </span>
                            </div>
                        </div>
                    )
                })
            ) : (
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-8 text-center backdrop-blur-xl">
                    <p className="text-4xl mb-3">📊</p>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">Nenhum orçamento ainda</p>
                    <p className="text-sm text-zinc-500 mt-1">Crie um orçamento para monitorar seus gastos por categoria</p>
                </div>
            )}

            {/* Add Budget Form */}
            {showForm ? (
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-5 backdrop-blur-xl">
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-4">Novo Orçamento</h4>

                    <div className="flex flex-col gap-3">
                        <select
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all capitalize"
                        >
                            <option value="">Selecione a categoria</option>
                            {availableCategories.map(c => (
                                <option key={c} value={c} className="capitalize">{c.toLowerCase()}</option>
                            ))}
                        </select>

                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={limite}
                                onChange={(e) => setLimite(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                            />
                        </div>

                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={handleCreate}
                                disabled={saving || !categoria || !limite}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 disabled:opacity-50 transition-all"
                            >
                                {saving ? 'Criando...' : 'Criar Orçamento'}
                            </button>
                            <button
                                onClick={() => { setShowForm(false); setCategoria(''); setLimite('') }}
                                className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                    <span className="text-lg">+</span> Novo Orçamento
                </button>
            )}
        </div>
    )
}
