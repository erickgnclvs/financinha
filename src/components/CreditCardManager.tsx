'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createCreditCard, deleteCreditCard, payCreditCard } from '@/app/accounts/actions'

interface CreditCard {
    id: string
    nome: string
    limite: number
    dia_fechamento: number
    dia_vencimento: number
    cor: string
}

interface Account {
    id: string
    nome: string
    tipo: string
    saldo_inicial: number
}

interface CreditCardManagerProps {
    cards: CreditCard[]
    transactions: Record<string, unknown>[]
    accounts: Account[]
}

// Show ALL transactions for a card (all unpaid)
function getBillTransactions(card: CreditCard, transactions: Record<string, unknown>[]) {
    return transactions
        .filter(t => t.credit_card_id === card.id)
        .sort((a, b) => new Date(String(b.data)).getTime() - new Date(String(a.data)).getTime())
}

export default function CreditCardManager({ cards, transactions, accounts }: CreditCardManagerProps) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [nome, setNome] = useState('')
    const [limite, setLimite] = useState('')
    const [fechamento, setFechamento] = useState('7')
    const [vencimento, setVencimento] = useState('15')
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Bill detail modal
    const [detailCardId, setDetailCardId] = useState<string | null>(null)

    // Pay card state
    const [payingCardId, setPayingCardId] = useState<string | null>(null)
    const [payAmount, setPayAmount] = useState('')
    const [payFromAccount, setPayFromAccount] = useState(accounts[0]?.id || '')
    const [paying, setPaying] = useState(false)

    // Memoize bill data
    const cardBills = useMemo(() => {
        return cards.map(card => {
            const txs = getBillTransactions(card, transactions)
            const bill = txs.reduce((sum, t) => sum + Number(t.valor), 0)
            return { card, txs, bill }
        })
    }, [cards, transactions])

    const detailCard = cardBills.find(c => c.card.id === detailCardId)

    const handleCreate = async () => {
        if (!nome || !limite) return
        setSaving(true)
        try {
            await createCreditCard({
                nome,
                limite: parseFloat(limite),
                dia_fechamento: parseInt(fechamento),
                dia_vencimento: parseInt(vencimento),
            })
            setNome(''); setLimite(''); setShowForm(false)
            router.refresh()
        } catch { alert('Erro ao criar cartão') }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            await deleteCreditCard(id)
            router.refresh()
        } catch { alert('Erro ao remover cartão') }
        setDeletingId(null)
    }

    const handlePay = async (card: CreditCard, bill: number) => {
        if (!payAmount) return
        setPaying(true)
        try {
            await payCreditCard({
                credit_card_id: card.id,
                from_account_id: payFromAccount,
                valor: parseFloat(payAmount),
                card_name: card.nome,
            })
            setPayingCardId(null); setPayAmount('')
            router.refresh()
        } catch { alert('Erro ao pagar fatura') }
        setPaying(false)
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                {cards.length > 0 ? (
                    cardBills.map(({ card, bill }) => {
                        const usedPercent = card.limite > 0 ? Math.min((bill / card.limite) * 100, 100) : 0
                        const available = card.limite - bill

                        return (
                            <div key={card.id} className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 overflow-hidden backdrop-blur-xl">
                                {/* Card Header — clickable to open bill detail */}
                                <button
                                    onClick={() => setDetailCardId(card.id)}
                                    className="w-full text-left p-5 bg-gradient-to-r from-violet-600 to-purple-600 text-white relative overflow-hidden group cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                                    <div className="flex justify-between items-start relative z-10">
                                        <div>
                                            <p className="text-sm font-semibold text-purple-200">💳 {card.nome}</p>
                                            <p className="text-2xl font-black mt-1">R$ {bill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            <p className="text-xs text-purple-200 mt-1">Fatura atual · Toque para ver detalhes</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-purple-200 opacity-0 group-hover:opacity-100 transition-opacity">Detalhes →</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(card.id) }}
                                                disabled={deletingId === card.id}
                                                className="text-xs text-purple-200 hover:text-white p-1 transition-colors"
                                            >
                                                {deletingId === card.id ? '...' : '✕'}
                                            </button>
                                        </div>
                                    </div>
                                </button>

                                {/* Usage Bar */}
                                <div className="px-5 py-4">
                                    <div className="flex justify-between text-xs font-medium text-zinc-500 mb-2">
                                        <span>Usado: R$ {bill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        <span>Limite: R$ {card.limite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${usedPercent > 90 ? 'bg-red-500' : usedPercent > 70 ? 'bg-amber-500' : 'bg-violet-500'}`}
                                            style={{ width: `${usedPercent}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className={`text-xs font-bold ${available < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {available >= 0 ? `R$ ${available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} disponível` : `R$ ${Math.abs(available).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acima`}
                                        </span>
                                        <div className="flex gap-3 text-xs text-zinc-400 font-medium">
                                            <span>Fecha dia {card.dia_fechamento}</span>
                                            <span>Vence dia {card.dia_vencimento}</span>
                                        </div>
                                    </div>

                                    {/* Pay Button / Form */}
                                    {payingCardId === card.id ? (
                                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">💰 Pagar Fatura</p>
                                            <div className="flex flex-col gap-2.5">
                                                <select
                                                    value={payFromAccount}
                                                    onChange={(e) => setPayFromAccount(e.target.value)}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                                                >
                                                    {accounts.map(a => (
                                                        <option key={a.id} value={a.id}>{a.nome}</option>
                                                    ))}
                                                </select>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">R$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder={bill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        value={payAmount}
                                                        onChange={(e) => setPayAmount(e.target.value)}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePay(card, bill)}
                                                        disabled={paying || !payAmount}
                                                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                                                    >
                                                        {paying ? 'Pagando...' : '✓ Pagar'}
                                                    </button>
                                                    <button
                                                        onClick={() => setPayAmount(String(bill))}
                                                        className="px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        Total
                                                    </button>
                                                    <button
                                                        onClick={() => setPayingCardId(null)}
                                                        className="px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : bill > 0 ? (
                                        <button
                                            onClick={() => { setPayingCardId(card.id); setPayFromAccount(accounts[0]?.id || '') }}
                                            className="mt-3 w-full py-2.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold transition-all"
                                        >
                                            💰 Pagar Fatura
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-8 text-center backdrop-blur-xl">
                        <p className="text-4xl mb-3">💳</p>
                        <p className="font-bold text-zinc-800 dark:text-zinc-200">Nenhum cartão cadastrado</p>
                        <p className="text-sm text-zinc-500 mt-1">Adicione seus cartões de crédito para acompanhar as faturas</p>
                    </div>
                )}

                {/* Add Card Form */}
                {showForm ? (
                    <div className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-5 backdrop-blur-xl">
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-4">Novo Cartão</h4>
                        <div className="flex flex-col gap-3">
                            <input placeholder="Nome do cartão (ex: Nubank)" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all" />
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">R$</span>
                                <input type="number" step="0.01" placeholder="Limite" value={limite} onChange={(e) => setLimite(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Dia Fechamento</label>
                                    <input type="number" min="1" max="31" value={fechamento} onChange={(e) => setFechamento(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Dia Vencimento</label>
                                    <input type="number" min="1" max="31" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all" />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-1">
                                <button onClick={handleCreate} disabled={saving || !nome || !limite} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 disabled:opacity-50 transition-all">{saving ? 'Criando...' : 'Adicionar Cartão'}</button>
                                <button onClick={() => { setShowForm(false); setNome(''); setLimite('') }} className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold transition-all">Cancelar</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowForm(true)} className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                        <span className="text-lg">+</span> Novo Cartão
                    </button>
                )}
            </div>

            {/* Bill Detail Modal */}
            {detailCard && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setDetailCardId(null) }}
                >
                    <div className="bg-zinc-50 dark:bg-zinc-950 w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-5 relative overflow-hidden flex-shrink-0">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-sm font-semibold text-purple-200">💳 {detailCard.card.nome}</p>
                                    <p className="text-3xl font-black mt-1">R$ {detailCard.bill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-xs text-purple-200 mt-2">
                                        {detailCard.txs.length} transações · Fecha dia {detailCard.card.dia_fechamento} · Vence dia {detailCard.card.dia_vencimento}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setDetailCardId(null)}
                                    className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Transaction List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {detailCard.txs.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {detailCard.txs.map((tx, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white dark:bg-zinc-900/50 rounded-xl p-3.5 border border-zinc-100 dark:border-zinc-800/50">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{String(tx.descricao)}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-zinc-400">{new Date(String(tx.data)).toLocaleDateString('pt-BR')}</span>
                                                    <span className="text-xs text-zinc-300 dark:text-zinc-700">·</span>
                                                    <span className="text-xs text-zinc-400 capitalize">{String(tx.categoria || '').toLowerCase()}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-rose-600 dark:text-rose-500 flex-shrink-0 pl-3">
                                                R$ {Number(tx.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-zinc-400">
                                    <p className="text-3xl mb-2">📭</p>
                                    <p className="font-medium">Nenhuma transação nesta fatura</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
