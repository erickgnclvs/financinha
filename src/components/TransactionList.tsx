'use client'

import { useState } from 'react'
import Link from 'next/link'
import TransactionForm from './TransactionForm'

const CATEGORY_EMOJI: Record<string, string> = {
    ALIMENTACAO: '🍽️',
    MERCADO: '🛒',
    CARRO: '🚗',
    MORADIA: '🏠',
    SAUDE: '💊',
    ASSINATURAS: '📱',
    PET: '🐶',
    BEBE: '👶',
    ROUPAS: '👕',
    LAZER: '🎮',
    CARTAO: '💳',
    PARCELAMENTOS: '📋',
    SALARIO: '💰',
    TAXAS: '🏛️',
    ESTACIONAMENTO: '🅿️',
    BELEZA: '💇',
    INVESTIMENTO: '📈',
    'ENTRADAS EXTRAS': '💸',
    PRESENTES: '🎁',
    'DESPESAS EVENTUAIS': '📌',
    CASA: '🏡',
    ALUGUEL: '🏠',
}

function getCategoryEmoji(cat: string | null | undefined): string {
    if (!cat) return '💰'
    return CATEGORY_EMOJI[cat.toUpperCase()] || '💰'
}

interface Transaction {
    id: string
    data: string
    descricao: string
    valor: number
    direcao: string
    categoria: string | null
    meio_pagamento: string | null
    observacoes: string | null
    created_at: string
}

interface TransactionListProps {
    transactions: Transaction[]
    showAllLink?: boolean
    limit?: number
}

export default function TransactionList({ transactions, showAllLink = false, limit }: TransactionListProps) {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

    // Sort by created_at descending (most recent first)
    const sorted = [...transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const displayTx = limit ? sorted.slice(0, limit) : sorted

    // Group by date
    const grouped = displayTx.reduce<Record<string, Transaction[]>>((acc, t) => {
        const dateKey = new Date(t.data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(t)
        return acc
    }, {})

    return (
        <>
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-lg font-bold">Transações Recentes</h3>
                {showAllLink && (
                    <Link href="/transactions" className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline">Ver todas →</Link>
                )}
            </div>

            {Object.keys(grouped).length > 0 ? (
                <div className="flex flex-col gap-6">
                    {Object.entries(grouped).map(([date, txs]) => (
                        <div key={date}>
                            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-2 capitalize">{date}</p>
                            <div className="grid gap-3">
                                {txs.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTransaction(t)}
                                        className="group relative bg-white dark:bg-zinc-900/50 p-5 rounded-2xl shadow-sm hover:shadow-md border border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer w-full text-left"
                                    >
                                        <div className={`absolute inset-y-0 left-0 w-1.5 rounded-l-2xl ${t.direcao === 'SAIDA' ? 'bg-rose-500' : t.direcao === 'ENTRADA' ? 'bg-emerald-500' : 'bg-zinc-400'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${t.direcao === 'SAIDA' ? 'bg-rose-50 dark:bg-rose-500/10' : t.direcao === 'ENTRADA' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                                                {getCategoryEmoji(t.categoria)}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-bold text-base text-zinc-800 dark:text-zinc-200 truncate">{t.descricao}</span>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 font-medium truncate">
                                                    {t.categoria && (
                                                        <span className="capitalize">{String(t.categoria).toLowerCase()}</span>
                                                    )}
                                                    {t.meio_pagamento && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                                                            <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{t.meio_pagamento}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-lg font-black tracking-tight whitespace-nowrap pl-2 ${t.direcao === 'SAIDA' ? 'text-rose-600 dark:text-rose-500' : t.direcao === 'ENTRADA' ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-500'}`}>
                                            {t.direcao === 'SAIDA' ? '-' : t.direcao === 'ENTRADA' ? '+' : ''}R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center text-zinc-500 text-sm font-medium">
                    Nenhuma transação encontrada.
                </div>
            )}

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedTransaction(null) }}
                >
                    <div className="bg-zinc-50 dark:bg-zinc-950 w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl overflow-y-auto animate-in zoom-in-95 fade-in duration-200">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="font-bold text-lg">Detalhes</h2>
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <TransactionForm
                                transaction={selectedTransaction}
                                onClose={() => setSelectedTransaction(null)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
