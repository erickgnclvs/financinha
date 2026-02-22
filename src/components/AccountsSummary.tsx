'use client'

import Link from 'next/link'

const ACCOUNT_TYPE_INFO: Record<string, { emoji: string; color: string }> = {
    corrente: { emoji: '🏦', color: 'from-blue-600 to-indigo-600' },
    poupanca: { emoji: '🐷', color: 'from-emerald-600 to-teal-600' },
    investimento: { emoji: '📈', color: 'from-amber-600 to-orange-600' },
}

interface Account {
    id: string
    nome: string
    tipo: string
    saldo_inicial: number
}

interface CreditCard {
    id: string
    nome: string
    limite: number
    dia_fechamento: number
    dia_vencimento: number
}

interface Props {
    accounts: Account[]
    creditCards: CreditCard[]
    transactions: Record<string, unknown>[]
}

export default function AccountsSummary({ accounts, creditCards, transactions }: Props) {
    if (!accounts.length && !creditCards.length) return null

    // Calculate account balances
    const accountBalances = accounts.map(acc => {
        const accTx = transactions.filter(t => t.account_id === acc.id)
        const txBalance = accTx.reduce((sum, t) => {
            if (t.direcao === 'ENTRADA') return sum + Number(t.valor)
            if (t.direcao === 'SAIDA') return sum - Number(t.valor)
            return sum
        }, 0)
        return { ...acc, balance: acc.saldo_inicial + txBalance }
    })

    // Calculate credit card bills (all unpaid transactions)
    const cardBills = creditCards.map(card => {
        const bill = transactions
            .filter(t => t.credit_card_id === card.id)
            .reduce((sum, t) => sum + Number(t.valor), 0)
        const usedPercent = card.limite > 0 ? Math.min((bill / card.limite) * 100, 100) : 0
        return { ...card, bill, usedPercent }
    })

    return (
        <div className="bg-white dark:bg-zinc-900/50 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-6 mb-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-lg">
                        🏦
                    </div>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">Contas & Cartões</h3>
                </div>
                <div className="flex gap-2">
                    <Link href="/accounts" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Contas</Link>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <Link href="/credit-cards" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">Cartões</Link>
                </div>
            </div>

            {/* Accounts Row */}
            {accountBalances.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 mb-3 scrollbar-hide">
                    {accountBalances.map(acc => {
                        const typeInfo = ACCOUNT_TYPE_INFO[acc.tipo] || ACCOUNT_TYPE_INFO.corrente
                        return (
                            <Link
                                key={acc.id}
                                href="/accounts"
                                className={`flex-shrink-0 min-w-[160px] bg-gradient-to-br ${typeInfo.color} rounded-2xl p-4 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">{typeInfo.emoji}</span>
                                    <span className="text-xs font-semibold opacity-80 truncate">{acc.nome}</span>
                                </div>
                                <p className="text-lg font-black">
                                    R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </Link>
                        )
                    })}
                </div>
            )}

            {/* Credit Cards Row */}
            {cardBills.length > 0 && (
                <div className="flex flex-col gap-2.5">
                    {cardBills.map(card => (
                        <Link
                            key={card.id}
                            href="/credit-cards"
                            className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="text-base flex-shrink-0">💳</span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{card.nome}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-20 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${card.usedPercent > 90 ? 'bg-red-500' : card.usedPercent > 70 ? 'bg-amber-500' : 'bg-violet-500'}`}
                                                style={{ width: `${card.usedPercent}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                            Vence dia {card.dia_vencimento}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 pl-3">
                                <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                                    R$ {card.bill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-[10px] text-zinc-400 font-medium">
                                    de R$ {card.limite.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
