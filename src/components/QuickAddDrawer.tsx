'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveTransaction } from '@/app/actions'

const CATEGORY_EMOJIS: Record<string, string> = {
    'ALIMENTACAO': '🍽️',
    'MERCADO': '🛒',
    'CARRO': '🚗',
    'MORADIA': '🏠',
    'SAUDE': '💊',
    'ASSINATURAS': '📱',
    'PET': '🐶',
    'BEBE': '👶',
    'ROUPAS': '👕',
    'LAZER': '🎮',
    'CARTAO': '💳',
    'PARCELAMENTOS': '📋',
    'SALARIO': '💰',
    'TAXAS': '🏛️',
    'ESTACIONAMENTO': '🅿️',
    'BELEZA': '💇',
    'INVESTIMENTO': '📈',
    'ENTRADAS EXTRAS': '💸',
    'PRESENTES': '🎁',
    'DESPESAS EVENTUAIS': '📌',
    'CASA': '🏡',
    'TRANSFERENCIA': '🔄',
    'ALUGUEL': '🏠',
}

const DEFAULT_EMOJI = '📌'

const TIME_SUGGESTIONS: Record<string, string[]> = {
    morning: ['MERCADO', 'CARRO', 'ALIMENTACAO'],
    lunch: ['ALIMENTACAO', 'MERCADO'],
    afternoon: ['LAZER', 'BEBE', 'ALIMENTACAO'],
    evening: ['ALIMENTACAO', 'LAZER', 'MERCADO'],
}

function getTimePeriod(): string {
    const h = new Date().getHours()
    if (h < 12) return 'morning'
    if (h < 14) return 'lunch'
    if (h < 18) return 'afternoon'
    return 'evening'
}

interface Account {
    id: string
    nome: string
    tipo: string
}

interface CreditCard {
    id: string
    nome: string
}

interface QuickAddDrawerProps {
    isOpen: boolean
    onClose: () => void
    categories: string[]
    accounts: Account[]
    creditCards: CreditCard[]
    recentTransactions: { descricao: string; valor: number; categoria: string; meio_pagamento: string; account_id?: string; credit_card_id?: string }[]
}

type Step = 'category' | 'amount' | 'details'

export default function QuickAddDrawer({
    isOpen, onClose, categories, accounts, creditCards, recentTransactions,
}: QuickAddDrawerProps) {
    const router = useRouter()
    const [step, setStep] = useState<Step>('category')
    const [direction, setDirection] = useState<'SAIDA' | 'ENTRADA'>('SAIDA')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [amount, setAmount] = useState('0')
    const [payment, setPayment] = useState('debito')
    // Default card: Nubank Erick PF, fallback to first
    const defaultCardId = creditCards.find(c => c.nome.includes('Erick PF'))?.id || creditCards[0]?.id || ''
    // Default account: Conta Principal, fallback to first corrente
    const defaultAccountId = accounts.find(a => a.nome === 'Conta Principal')?.id || accounts.find(a => a.tipo === 'corrente')?.id || accounts[0]?.id || ''
    // Dinheiro account for cash payments
    const dinheiroAccountId = accounts.find(a => a.nome === 'Dinheiro')?.id || ''
    // Sort accounts: Conta Principal first
    const sortedAccounts = [...accounts].sort((a, b) => {
        if (a.nome === 'Conta Principal') return -1
        if (b.nome === 'Conta Principal') return 1
        return 0
    })
    const [selectedCard, setSelectedCard] = useState(defaultCardId)
    const [description, setDescription] = useState('')
    const [selectedAccount, setSelectedAccount] = useState(defaultAccountId)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [saving, setSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setStep('category')
            setDirection('SAIDA')
            setSelectedCategory('')
            setAmount('0')
            setPayment('debito')
            setSelectedCard(defaultCardId)
            setDescription('')
            setSelectedAccount(defaultAccountId)
            setSelectedDate(new Date().toISOString().split('T')[0])
            setShowSuccess(false)
        }
    }, [isOpen, creditCards, accounts])

    const handleCategorySelect = useCallback((cat: string) => {
        setSelectedCategory(cat)
        setDescription(cat.charAt(0) + cat.slice(1).toLowerCase())
        setStep('amount')
    }, [])

    const handleQuickReentry = useCallback(async (tx: typeof recentTransactions[0]) => {
        setSaving(true)
        try {
            await saveTransaction({
                descricao: tx.descricao,
                valor: tx.valor,
                direcao: 'SAIDA',
                categoria: tx.categoria,
                meio_pagamento: tx.meio_pagamento,
                account_id: tx.account_id || null,
                credit_card_id: tx.credit_card_id || null,
                afeta_caixa: tx.meio_pagamento !== 'credito',
                data: new Date().toISOString(),
            })
            setShowSuccess(true)
            router.refresh()
            setTimeout(() => onClose(), 1200)
        } catch { alert('Erro ao salvar') }
        setSaving(false)
    }, [router, onClose])

    const handleNumpad = useCallback((key: string) => {
        setAmount(prev => {
            if (key === 'backspace') {
                const next = prev.slice(0, -1)
                return next || '0'
            }
            if (key === ',') {
                if (prev.includes(',')) return prev
                return prev + ','
            }
            if (prev === '0' && key !== ',') return key
            // Max 2 decimal places
            const parts = prev.split(',')
            if (parts[1] && parts[1].length >= 2) return prev
            return prev + key
        })
    }, [])

    const handleQuickAmount = useCallback((val: number) => {
        setAmount(val.toString())
    }, [])

    const handleSave = async () => {
        const numericAmount = parseFloat(amount.replace(',', '.'))
        if (!numericAmount || !selectedCategory) return
        setSaving(true)
        try {
            await saveTransaction({
                descricao: description || selectedCategory,
                valor: numericAmount,
                direcao: direction,
                categoria: selectedCategory.toUpperCase(),
                meio_pagamento: payment,
                account_id: payment === 'credito' ? null : (payment === 'dinheiro' && dinheiroAccountId ? dinheiroAccountId : selectedAccount) || null,
                credit_card_id: payment === 'credito' ? (selectedCard || null) : null,
                afeta_caixa: payment !== 'credito',
                data: new Date(selectedDate + 'T12:00:00').toISOString(),
            })
            setShowSuccess(true)
            router.refresh()
            setTimeout(() => onClose(), 1200)
        } catch { alert('Erro ao salvar') }
        setSaving(false)
    }

    if (!isOpen) return null

    // Build category list: user's categories + defaults
    const allCategories = Array.from(new Set([...categories.filter(c => c !== 'TRANSFERENCIA' && c !== 'CARTAO')]))
    const timePeriod = getTimePeriod()
    const suggestions = TIME_SUGGESTIONS[timePeriod]?.filter(c => allCategories.includes(c)) || []

    // Unique recent transactions (last 3)
    const recentUnique = recentTransactions
        .filter((tx, i, arr) => i === arr.findIndex(t => t.descricao === tx.descricao && t.valor === tx.valor))
        .slice(0, 4)

    const numericAmountDisplay = amount.replace(',', '.')
    const parsedAmount = parseFloat(numericAmountDisplay) || 0

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

                {/* Success Overlay */}
                {showSuccess && (
                    <div className="absolute inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center rounded-t-3xl">
                        <div className="text-6xl mb-4 animate-bounce">✅</div>
                        <p className="text-xl font-black text-zinc-800 dark:text-zinc-200">Salvo!</p>
                        <p className="text-sm text-zinc-400 mt-1">R$ {parsedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                )}

                {/* Header */}
                <div className="px-5 py-3 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {step !== 'category' && (
                            <button
                                onClick={() => setStep(step === 'details' ? 'amount' : 'category')}
                                className="p-1.5 -ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                        )}
                        <h3 className="font-bold text-zinc-800 dark:text-zinc-200">
                            {step === 'category' ? 'Nova Transação' : step === 'amount' ? 'Valor' : 'Detalhes'}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Direction toggle */}
                        {step === 'category' && (
                            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-full p-0.5">
                                <button
                                    onClick={() => setDirection('SAIDA')}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${direction === 'SAIDA' ? 'bg-rose-500 text-white shadow-sm' : 'text-zinc-500'}`}
                                >
                                    Gasto
                                </button>
                                <button
                                    onClick={() => setDirection('ENTRADA')}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${direction === 'ENTRADA' ? 'bg-emerald-500 text-white shadow-sm' : 'text-zinc-500'}`}
                                >
                                    Receita
                                </button>
                            </div>
                        )}
                        <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* ═══ STEP 1: Category Selection ═══ */}
                {step === 'category' && (
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Recent Transactions */}
                        {recentUnique.length > 0 && (
                            <div className="mb-5">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">⚡ Repetir recente</p>
                                <div className="flex flex-col gap-1.5">
                                    {recentUnique.map((tx, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleQuickReentry(tx)}
                                            disabled={saving}
                                            className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl px-3.5 py-2.5 transition-colors text-left group"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-base flex-shrink-0">{CATEGORY_EMOJIS[tx.categoria] || DEFAULT_EMOJI}</span>
                                                <span className="text-sm font-semibold truncate text-zinc-700 dark:text-zinc-300">{tx.descricao}</span>
                                            </div>
                                            <span className="text-sm font-bold text-zinc-500 flex-shrink-0 pl-2 group-hover:text-rose-500 transition-colors">
                                                R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggested */}
                        {suggestions.length > 0 && (
                            <div className="mb-5">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">💡 Sugestões</p>
                                <div className="flex gap-2">
                                    {suggestions.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => handleCategorySelect(cat)}
                                            className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full px-3.5 py-2 transition-colors"
                                        >
                                            <span className="text-sm">{CATEGORY_EMOJIS[cat] || DEFAULT_EMOJI}</span>
                                            <span className="text-xs font-bold capitalize">{cat.toLowerCase()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category Grid */}
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">📂 Categorias</p>
                        <div className="grid grid-cols-3 gap-2">
                            {allCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategorySelect(cat)}
                                    className="flex flex-col items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl p-3 transition-all hover:scale-[1.03] active:scale-95"
                                >
                                    <span className="text-2xl">{CATEGORY_EMOJIS[cat] || DEFAULT_EMOJI}</span>
                                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 capitalize leading-tight text-center">{cat.toLowerCase()}</span>
                                </button>
                            ))}
                            {/* Add custom */}
                            <button
                                onClick={() => {
                                    const cat = prompt('Nova categoria (ex: ACADEMIA)')
                                    if (cat) handleCategorySelect(cat.toUpperCase())
                                }}
                                className="flex flex-col items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl p-3 transition-all border-2 border-dashed border-zinc-200 dark:border-zinc-700"
                            >
                                <span className="text-2xl">➕</span>
                                <span className="text-[10px] font-bold text-zinc-400 capitalize leading-tight">Outra</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 2: Amount Numpad ═══ */}
                {step === 'amount' && (
                    <div className="flex-1 flex flex-col">
                        {/* Amount Display */}
                        <div className="px-6 pt-6 pb-4 text-center">
                            <div className="flex items-center justify-center gap-1 mb-3">
                                <span className="text-lg">{CATEGORY_EMOJIS[selectedCategory] || DEFAULT_EMOJI}</span>
                                <span className="text-sm font-bold text-zinc-400 capitalize">{selectedCategory.toLowerCase()}</span>
                            </div>
                            <p className={`text-5xl font-black tracking-tight ${direction === 'ENTRADA' ? 'text-emerald-600' : 'text-zinc-800 dark:text-zinc-100'}`}>
                                <span className="text-2xl font-bold text-zinc-400 mr-1">R$</span>
                                {amount}
                            </p>
                        </div>

                        {/* Quick amounts */}
                        <div className="flex gap-2 px-4 mb-3 justify-center">
                            {[10, 20, 50, 100, 200].map(val => (
                                <button
                                    key={val}
                                    onClick={() => handleQuickAmount(val)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${amount === String(val)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>

                        {/* Payment method */}
                        <div className="flex gap-1.5 px-4 mb-4 justify-center">
                            {[
                                { key: 'debito', label: 'Débito', icon: '💳' },
                                { key: 'credito', label: 'Crédito', icon: '💎' },
                                { key: 'pix', label: 'Pix', icon: '⚡' },
                                { key: 'dinheiro', label: 'Dinheiro', icon: '💵' },
                            ].map(m => (
                                <button
                                    key={m.key}
                                    onClick={() => setPayment(m.key)}
                                    className={`px-2.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${payment === m.key
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    <span>{m.icon}</span> {m.label}
                                </button>
                            ))}
                        </div>

                        {/* Credit card selector */}
                        {payment === 'credito' && creditCards.length > 0 && (
                            <div className="px-4 mb-3">
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {creditCards.map(card => (
                                        <button
                                            key={card.id}
                                            onClick={() => setSelectedCard(card.id)}
                                            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedCard === card.id
                                                ? 'bg-violet-600 text-white shadow-sm'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                                }`}
                                        >
                                            💳 {card.nome}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Account selector for débito/pix (not dinheiro — auto-assigned) */}
                        {(payment === 'debito' || payment === 'pix') && sortedAccounts.length > 0 && (
                            <div className="px-4 mb-3">
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {sortedAccounts.map(acc => (
                                        <button
                                            key={acc.id}
                                            onClick={() => setSelectedAccount(acc.id)}
                                            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedAccount === acc.id
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                                }`}
                                        >
                                            🏦 {acc.nome}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Numpad */}
                        <div className="grid grid-cols-3 gap-1.5 px-4 pb-3 mt-auto">
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'backspace'].map(key => (
                                <button
                                    key={key}
                                    onClick={() => handleNumpad(key)}
                                    className={`py-4 rounded-2xl text-xl font-bold transition-all active:scale-95 ${key === 'backspace'
                                        ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'
                                        : key === ','
                                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                            : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    {key === 'backspace' ? '⌫' : key}
                                </button>
                            ))}
                        </div>

                        {/* Next button */}
                        <div className="px-4 pb-4">
                            <button
                                onClick={() => setStep('details')}
                                disabled={parsedAmount <= 0}
                                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-40 transition-all active:scale-[0.98]"
                            >
                                Continuar →
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 3: Details ═══ */}
                {step === 'details' && (
                    <div className="flex-1 flex flex-col p-4 gap-3">
                        {/* Summary */}
                        <div className={`rounded-2xl p-4 text-center ${direction === 'ENTRADA' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                            <span className="text-2xl">{CATEGORY_EMOJIS[selectedCategory] || DEFAULT_EMOJI}</span>
                            <p className={`text-3xl font-black mt-1 ${direction === 'ENTRADA' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                R$ {parsedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs font-bold text-zinc-400 capitalize mt-1">{selectedCategory.toLowerCase()} · {payment}</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Descrição</label>
                            <input
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="O que foi?"
                                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Data</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                            />
                        </div>



                        {/* Save */}
                        <button
                            onClick={handleSave}
                            disabled={saving || parsedAmount <= 0}
                            className={`mt-auto w-full py-4 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${direction === 'ENTRADA'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/25'
                                : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-rose-500/25'
                                }`}
                        >
                            {saving ? 'Salvando...' : direction === 'ENTRADA' ? '✓ Registrar Receita' : '✓ Registrar Gasto'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
