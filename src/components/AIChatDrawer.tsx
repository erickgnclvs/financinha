'use client'

import { useState } from 'react'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

export default function AIChatDrawer({
    isOpen,
    onClose,
    onSaveTransaction
}: {
    isOpen: boolean;
    onClose: () => void;
    onSaveTransaction: (transaction: Record<string, unknown>) => Promise<void>;
}) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [pendingTransaction, setPendingTransaction] = useState<Record<string, unknown> | null>(null)

    if (!isOpen) return null

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || loading) return

        const userMessage = { role: 'user' as const, content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            // Send chat history (excluding the very last user message which is sent separately)
            // Actually we send context
            const context = messages.slice(-4) // keep last 4 messages

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.content, context })
            })

            if (!res.ok) throw new Error('API request failed')

            const data = await res.json()

            if (data.tipo === 'pergunta') {
                setMessages(prev => [...prev, { role: 'assistant', content: data.pergunta }])
            } else if (data.tipo === 'transacao') {
                setPendingTransaction(data.transacao)
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Entendido! Deseja salvar: ${data.transacao.descricao} no valor de R$ ${data.transacao.valor}?`
                }])
            }
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Ops, houve um erro ao processar. Tente novamente.' }])
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!pendingTransaction) return
        setLoading(true)
        try {
            await onSaveTransaction({
                ...pendingTransaction,
                data: new Date().toISOString()
            })
            setMessages(prev => [...prev, { role: 'assistant', content: 'Transação salva com sucesso!' }])
            setPendingTransaction(null)
            setTimeout(() => {
                setMessages([])
                onClose()
            }, 1500)
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao salvar a transação.' }])
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-0">
            <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[80vh] sm:h-[600px] overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

                {/* Header */}
                <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">AI</div>
                        <h3 className="font-bold">Assistente</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1 items-start">
                        <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[85%]">
                            Olá! Me conte o que você gastou ou recebeu. Ex: &quot;gastei 25 em pizza&quot;
                        </div>
                    </div>

                    {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] ${m.role === 'user'
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

                    {pendingTransaction && !loading && (
                        <div className="flex flex-col gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl mx-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Descrição</span>
                                <span className="font-semibold">{String(pendingTransaction.descricao)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Valor</span>
                                <span className="font-semibold">R$ {String(pendingTransaction.valor)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Categoria</span>
                                <span className="font-semibold">{String(pendingTransaction.categoria)}</span>
                            </div>
                            <button
                                onClick={handleConfirm}
                                className="mt-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                Confirmar e Salvar
                            </button>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                    <form onSubmit={handleSend} className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite aqui..."
                            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full pl-5 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            disabled={loading || !!pendingTransaction}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading || !!pendingTransaction}
                            className="absolute right-2 w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:bg-zinc-400 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
