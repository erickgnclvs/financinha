'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateTransaction, deleteTransaction } from '@/app/actions'

const CATEGORY_OPTIONS = [
    'CARRO', 'MERCADO', 'RESTAURANTE/IFOOD', 'SAUDE', 'LAZER',
    'ALUGUEL', 'CONTAS', 'BELEZA', 'ROUPAS/CALÇADO', 'INVESTIMENTO',
    'DESENVOLVIMENTO PESSOAL', 'DESPESAS EVENTUAIS',
]

const PAYMENT_OPTIONS = ['debito', 'credito', 'pix', 'dinheiro', 'transferencia']

interface TransactionFormProps {
    transaction: {
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
    onClose?: () => void
}

export default function TransactionForm({ transaction, onClose }: TransactionFormProps) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const [descricao, setDescricao] = useState(transaction.descricao)
    const [valor, setValor] = useState(String(transaction.valor))
    const [direcao, setDirecao] = useState(transaction.direcao)
    const [categoria, setCategoria] = useState(transaction.categoria || '')
    const [meioPagamento, setMeioPagamento] = useState(transaction.meio_pagamento || '')
    const [data, setData] = useState(transaction.data)
    const [observacoes, setObservacoes] = useState(transaction.observacoes || '')

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateTransaction(transaction.id, {
                descricao,
                valor: parseFloat(valor),
                direcao,
                categoria: categoria || null,
                meio_pagamento: meioPagamento || null,
                data,
                observacoes: observacoes || null,
            })
            setEditing(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar')
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await deleteTransaction(transaction.id)
            if (onClose) {
                onClose()
            } else {
                router.push('/transactions')
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao excluir')
            setDeleting(false)
        }
    }

    const handleCancel = () => {
        setDescricao(transaction.descricao)
        setValor(String(transaction.valor))
        setDirecao(transaction.direcao)
        setCategoria(transaction.categoria || '')
        setMeioPagamento(transaction.meio_pagamento || '')
        setData(transaction.data)
        setObservacoes(transaction.observacoes || '')
        setEditing(false)
        setShowDeleteConfirm(false)
    }

    return (
        <div className="w-full max-w-2xl">
            {/* Amount Header */}
            <div className={`text-center mb-8 ${editing ? '' : ''}`}>
                <p className={`text-5xl font-black tracking-tight ${direcao === 'SAIDA' ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                    {direcao === 'SAIDA' ? '-' : '+'}R$ {editing ? (
                        <input
                            type="number"
                            step="0.01"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            className="inline-block w-48 bg-transparent border-b-2 border-current text-center outline-none font-black text-5xl"
                        />
                    ) : (
                        Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    )}
                </p>
                {!editing && (
                    <p className="text-sm text-zinc-500 font-medium mt-2">
                        Adicionada em {new Date(transaction.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
            </div>

            {/* Fields Card */}
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-zinc-800/50 overflow-hidden">
                {/* Description */}
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/50">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Descrição</label>
                    {editing ? (
                        <input
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                        />
                    ) : (
                        <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{descricao}</p>
                    )}
                </div>

                {/* Date */}
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/50">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Data</label>
                    {editing ? (
                        <input
                            type="date"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                        />
                    ) : (
                        <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                            {new Date(data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    )}
                </div>

                {/* Direction */}
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/50">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Tipo</label>
                    {editing ? (
                        <div className="flex gap-2">
                            {['SAIDA', 'ENTRADA'].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDirecao(d)}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${direcao === d
                                        ? d === 'SAIDA'
                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 ring-2 ring-rose-500/30'
                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 ring-2 ring-emerald-500/30'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                        }`}
                                >
                                    {d === 'SAIDA' ? '↑ Saída' : '↓ Entrada'}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${direcao === 'SAIDA' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                            {direcao === 'SAIDA' ? '↑ Saída' : '↓ Entrada'}
                        </span>
                    )}
                </div>

                {/* Category */}
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/50">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Categoria</label>
                    {editing ? (
                        <select
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all capitalize"
                        >
                            <option value="">Sem categoria</option>
                            {CATEGORY_OPTIONS.map(c => (
                                <option key={c} value={c} className="capitalize">{c.toLowerCase()}</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300 capitalize">
                            {categoria ? categoria.toLowerCase() : 'Sem categoria'}
                        </p>
                    )}
                </div>

                {/* Payment Method */}
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/50">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Meio de Pagamento</label>
                    {editing ? (
                        <select
                            value={meioPagamento}
                            onChange={(e) => setMeioPagamento(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all capitalize"
                        >
                            <option value="">Não informado</option>
                            {PAYMENT_OPTIONS.map(p => (
                                <option key={p} value={p} className="capitalize">{p}</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300 capitalize">
                            {meioPagamento || 'Não informado'}
                        </p>
                    )}
                </div>

                {/* Notes */}
                <div className="px-6 py-5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Observações</label>
                    {editing ? (
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            rows={3}
                            placeholder="Adicione uma nota..."
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
                        />
                    ) : (
                        <p className="text-base text-zinc-700 dark:text-zinc-300">
                            {observacoes || <span className="text-zinc-400 italic">Nenhuma observação</span>}
                        </p>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-3">
                {editing ? (
                    <>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50 hover:-translate-y-0.5 transition-all"
                        >
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-2xl transition-all"
                        >
                            Cancelar
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setEditing(true)}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 transition-all"
                        >
                            ✏️  Editar Transação
                        </button>

                        {showDeleteConfirm ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
                                >
                                    {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full py-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-all"
                            >
                                🗑  Excluir Transação
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
