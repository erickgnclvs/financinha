'use client'

import { useState, useRef, useEffect } from 'react'
import { saveTransaction } from '@/app/actions'
import { transferBetweenAccounts, payCreditCard } from '@/app/accounts/actions'
import { useRouter } from 'next/navigation'

type Message = {
    role: 'user' | 'assistant'
    content: string
    actionType?: string
    actionData?: Record<string, unknown>
}

const SUGGESTION_CHIPS = [
    { label: '📊 Resumo do mês', message: 'me dê um resumo completo do mês' },
    { label: '💸 Quanto gastei?', message: 'quanto gastei esse mês?' },
    { label: '📅 Gastos hoje', message: 'quanto gastei hoje?' },
    { label: '💳 Fatura', message: 'qual o valor das faturas dos cartões?' },
    { label: '🏦 Saldos', message: 'qual o saldo das minhas contas?' },
    { label: '📈 Semana', message: 'resumo dos últimos 7 dias' },
]

const ACTION_STYLES: Record<string, { icon: string; bg: string; accent: string; label: string }> = {
    transacao_saida: { icon: '🔴', bg: 'bg-red-50 dark:bg-red-900/20', accent: 'border-red-200 dark:border-red-800', label: 'Novo Gasto' },
    transacao_entrada: { icon: '🟢', bg: 'bg-emerald-50 dark:bg-emerald-900/20', accent: 'border-emerald-200 dark:border-emerald-800', label: 'Nova Receita' },
    transferencia: { icon: '🔄', bg: 'bg-blue-50 dark:bg-blue-900/20', accent: 'border-blue-200 dark:border-blue-800', label: 'Transferência' },
    pagar_fatura: { icon: '💳', bg: 'bg-violet-50 dark:bg-violet-900/20', accent: 'border-violet-200 dark:border-violet-800', label: 'Pagar Fatura' },
}

export default function AIChatDrawer({
    isOpen,
    onClose
}: {
    isOpen: boolean
    onClose: () => void
}) {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [pendingAction, setPendingAction] = useState<{ type: string; data: Record<string, unknown> } | null>(null)
    const chatRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
    }, [messages, loading])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleSend = async (text?: string) => {
        const msgText = text || input.trim()
        if (!msgText || loading) return

        const userMessage: Message = { role: 'user', content: msgText }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)
        setPendingAction(null)

        try {
            const context = messages.slice(-6)
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msgText, context: context.map(m => ({ role: m.role, content: m.content })) })
            })
            if (!res.ok) throw new Error('API request failed')

            const data = await res.json()

            if (data.tipo === 'transacao' && data.transacao) {
                const tx = data.transacao
                const actionKey = tx.direcao === 'ENTRADA' ? 'transacao_entrada' : 'transacao_saida'
                setPendingAction({ type: actionKey, data: tx })
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `${tx.direcao === 'ENTRADA' ? 'Receita' : 'Gasto'}: ${tx.descricao} — R$ ${Number(tx.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    actionType: actionKey,
                    actionData: tx,
                }])
            } else if (data.tipo === 'transferencia' && data.transferencia) {
                setPendingAction({ type: 'transferencia', data: data.transferencia })
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Transferência de R$ ${Number(data.transferencia.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    actionType: 'transferencia',
                    actionData: data.transferencia,
                }])
            } else if (data.tipo === 'pagar_fatura' && data.pagamento) {
                setPendingAction({ type: 'pagar_fatura', data: data.pagamento })
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Pagar fatura: ${data.pagamento.card_name} — R$ ${Number(data.pagamento.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    actionType: 'pagar_fatura',
                    actionData: data.pagamento,
                }])
            } else if (data.tipo === 'pergunta') {
                setMessages(prev => [...prev, { role: 'assistant', content: data.pergunta }])
            } else if (data.tipo === 'consulta' || data.tipo === 'resumo' || data.tipo === 'conversa') {
                setMessages(prev => [...prev, { role: 'assistant', content: data.resposta }])
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.resposta || data.pergunta || 'Desculpe, não entendi.' }])
            }
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Ops, houve um erro. Tente novamente.' }])
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!pendingAction) return
        setLoading(true)
        try {
            if (pendingAction.type === 'transacao_saida' || pendingAction.type === 'transacao_entrada') {
                await saveTransaction({
                    ...pendingAction.data,
                    data: new Date().toISOString(),
                })
                setMessages(prev => [...prev, { role: 'assistant', content: '✅ Transação salva!' }])
            } else if (pendingAction.type === 'transferencia') {
                await transferBetweenAccounts({
                    from_account_id: String(pendingAction.data.from_account_id),
                    to_account_id: String(pendingAction.data.to_account_id),
                    valor: Number(pendingAction.data.valor),
                    descricao: String(pendingAction.data.descricao || 'Transferência via AI'),
                })
                setMessages(prev => [...prev, { role: 'assistant', content: '✅ Transferência realizada!' }])
            } else if (pendingAction.type === 'pagar_fatura') {
                await payCreditCard({
                    credit_card_id: String(pendingAction.data.credit_card_id),
                    from_account_id: String(pendingAction.data.from_account_id),
                    valor: Number(pendingAction.data.valor),
                    card_name: String(pendingAction.data.card_name),
                })
                setMessages(prev => [...prev, { role: 'assistant', content: '✅ Fatura paga!' }])
            }
            setPendingAction(null)
            router.refresh()
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erro ao executar ação.' }])
        }
        setLoading(false)
    }

    const handleCancel = () => {
        setPendingAction(null)
        setMessages(prev => [...prev, { role: 'assistant', content: 'Ok, ação cancelada. O que mais posso fazer?' }])
    }

    const getActionStyle = (type?: string) => {
        if (!type) return null
        return ACTION_STYLES[type] || null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[650px] overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

                {/* Header */}
                <div className="px-5 py-3.5 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-base">✨</div>
                        <div>
                            <h3 className="font-bold text-sm">Assistente Financinha</h3>
                            <p className="text-[10px] text-blue-200">Gastos · Transferências · Consultas</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                {/* Chat Area */}
                <div ref={chatRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {/* Welcome */}
                    <div className="flex flex-col gap-1 items-start">
                        <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[85%]">
                            Olá! 👋 Eu sou seu assistente financeiro. Posso:
                        </div>
                        <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-2xl rounded-tl-sm text-xs max-w-[85%] leading-relaxed text-zinc-600 dark:text-zinc-400">
                            🔴 Registrar gastos e receitas<br />
                            🔄 Transferir entre contas<br />
                            💳 Pagar faturas de cartões<br />
                            📊 Dar resumos e responder perguntas
                        </div>
                    </div>

                    {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] whitespace-pre-line ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : 'bg-zinc-100 dark:bg-zinc-800 rounded-tl-sm'
                                }`}>
                                {m.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-start">
                            <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    )}

                    {/* Pending Action Card */}
                    {pendingAction && !loading && (() => {
                        const style = getActionStyle(pendingAction.type)
                        if (!style) return null
                        return (
                            <div className={`flex flex-col gap-2 p-4 ${style.bg} border ${style.accent} rounded-2xl mx-1`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base">{style.icon}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{style.label}</span>
                                </div>

                                {/* Transaction details */}
                                {(pendingAction.type === 'transacao_saida' || pendingAction.type === 'transacao_entrada') && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Descrição</span>
                                            <span className="font-semibold">{String(pendingAction.data.descricao)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Valor</span>
                                            <span className="font-bold">R$ {Number(pendingAction.data.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Categoria</span>
                                            <span className="font-semibold capitalize">{String(pendingAction.data.categoria || '').toLowerCase()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Pagamento</span>
                                            <span className="font-semibold capitalize">{String(pendingAction.data.meio_pagamento || 'debito')}</span>
                                        </div>
                                    </>
                                )}

                                {/* Transfer details */}
                                {pendingAction.type === 'transferencia' && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Valor</span>
                                            <span className="font-bold">R$ {Number(pendingAction.data.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Descrição</span>
                                            <span className="font-semibold">{String(pendingAction.data.descricao || 'Transferência')}</span>
                                        </div>
                                    </>
                                )}

                                {/* Pay card details */}
                                {pendingAction.type === 'pagar_fatura' && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Cartão</span>
                                            <span className="font-semibold">{String(pendingAction.data.card_name)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Valor</span>
                                            <span className="font-bold">R$ {Number(pendingAction.data.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleConfirm}
                                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors"
                                    >
                                        ✓ Confirmar
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 font-bold text-sm rounded-xl transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )
                    })()}
                </div>

                {/* Suggestion Chips — only show when no messages yet */}
                {messages.length === 0 && !loading && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                        {SUGGESTION_CHIPS.map((chip, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(chip.message)}
                                className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-xs font-semibold transition-colors"
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="relative flex items-center">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={pendingAction ? 'Confirme ou cancele acima' : 'Gastei 50 no mercado...'}
                            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            disabled={loading || !!pendingAction}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading || !!pendingAction}
                            className="absolute right-1.5 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:bg-zinc-400 transition-all hover:bg-blue-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
