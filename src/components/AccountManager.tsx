'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAccount, deleteAccount, transferBetweenAccounts } from '@/app/accounts/actions'

const ACCOUNT_TYPES = [
    { value: 'corrente', label: 'Conta Corrente', emoji: '🏦', color: 'from-blue-600 to-indigo-600' },
    { value: 'poupanca', label: 'Poupança', emoji: '🐷', color: 'from-emerald-600 to-teal-600' },
    { value: 'investimento', label: 'Investimento', emoji: '📈', color: 'from-amber-600 to-orange-600' },
]

interface Account {
    id: string
    nome: string
    tipo: string
    saldo_inicial: number
    cor: string
}

interface AccountManagerProps {
    accounts: Account[]
    transactions: Record<string, unknown>[]
}

export default function AccountManager({ accounts, transactions }: AccountManagerProps) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [showTransfer, setShowTransfer] = useState(false)
    const [nome, setNome] = useState('')
    const [tipo, setTipo] = useState('corrente')
    const [saldoInicial, setSaldoInicial] = useState('0')
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Transfer state
    const [fromAccount, setFromAccount] = useState('')
    const [toAccount, setToAccount] = useState('')
    const [transferValor, setTransferValor] = useState('')
    const [transferDesc, setTransferDesc] = useState('')
    const [transferring, setTransferring] = useState(false)

    const handleCreate = async () => {
        if (!nome) return
        setSaving(true)
        try {
            await createAccount({ nome, tipo, saldo_inicial: parseFloat(saldoInicial) || 0 })
            setNome(''); setTipo('corrente'); setSaldoInicial('0'); setShowForm(false)
            router.refresh()
        } catch { alert('Erro ao criar conta') }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            await deleteAccount(id)
            router.refresh()
        } catch { alert('Erro ao remover conta') }
        setDeletingId(null)
    }

    const handleTransfer = async () => {
        if (!fromAccount || !toAccount || !transferValor || fromAccount === toAccount) return
        setTransferring(true)
        try {
            await transferBetweenAccounts({
                from_account_id: fromAccount,
                to_account_id: toAccount,
                valor: parseFloat(transferValor),
                descricao: transferDesc || 'Transferência entre contas',
            })
            setFromAccount(''); setToAccount(''); setTransferValor(''); setTransferDesc(''); setShowTransfer(false)
            router.refresh()
        } catch { alert('Erro na transferência') }
        setTransferring(false)
    }

    const getAccountBalance = (account: Account) => {
        const accountTx = transactions.filter(t => t.account_id === account.id)
        const txBalance = accountTx.reduce((acc, t) => {
            if (t.direcao === 'ENTRADA') return acc + Number(t.valor)
            if (t.direcao === 'SAIDA') return acc - Number(t.valor)
            return acc
        }, 0)
        return account.saldo_inicial + txBalance
    }

    return (
        <div className="flex flex-col gap-4">
            {accounts.length > 0 ? (
                accounts.map(account => {
                    const balance = getAccountBalance(account)
                    const typeInfo = ACCOUNT_TYPES.find(t => t.value === account.tipo) || ACCOUNT_TYPES[0]

                    return (
                        <div key={account.id} className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 overflow-hidden backdrop-blur-xl">
                            <div className={`p-5 bg-gradient-to-r ${typeInfo.color} text-white relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <p className="text-sm font-semibold opacity-80">{typeInfo.emoji} {typeInfo.label}</p>
                                        <p className="text-lg font-bold mt-0.5">{account.nome}</p>
                                        <p className="text-3xl font-black mt-2">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(account.id)}
                                        disabled={deletingId === account.id}
                                        className="text-xs opacity-70 hover:opacity-100 p-1 transition-opacity"
                                    >
                                        {deletingId === account.id ? '...' : '✕'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })
            ) : (
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-8 text-center backdrop-blur-xl">
                    <p className="text-4xl mb-3">🏦</p>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">Nenhuma conta cadastrada</p>
                    <p className="text-sm text-zinc-500 mt-1">Adicione suas contas para acompanhar saldos separadamente</p>
                </div>
            )}

            {/* Transfer Form */}
            {showTransfer && accounts.length >= 2 ? (
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-5 backdrop-blur-xl">
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                        <span>🔄</span> Transferir entre Contas
                    </h4>
                    <div className="flex flex-col gap-3">
                        <select
                            value={fromAccount}
                            onChange={(e) => setFromAccount(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        >
                            <option value="">De qual conta?</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.nome} (R$ {getAccountBalance(a).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</option>
                            ))}
                        </select>
                        <div className="flex justify-center text-zinc-400">↓</div>
                        <select
                            value={toAccount}
                            onChange={(e) => setToAccount(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        >
                            <option value="">Para qual conta?</option>
                            {accounts.filter(a => a.id !== fromAccount).map(a => (
                                <option key={a.id} value={a.id}>{a.nome}</option>
                            ))}
                        </select>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Valor"
                                value={transferValor}
                                onChange={(e) => setTransferValor(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <input
                            placeholder="Descrição (opcional)"
                            value={transferDesc}
                            onChange={(e) => setTransferDesc(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        />
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={handleTransfer}
                                disabled={transferring || !fromAccount || !toAccount || !transferValor || fromAccount === toAccount}
                                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all"
                            >
                                {transferring ? 'Transferindo...' : '🔄 Transferir'}
                            </button>
                            <button
                                onClick={() => setShowTransfer(false)}
                                className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex gap-3">
                {!showForm && !showTransfer && (
                    <>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">+</span> Nova Conta
                        </button>
                        {accounts.length >= 2 && (
                            <button
                                onClick={() => setShowTransfer(true)}
                                className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                🔄 Transferir
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Create Account Form */}
            {showForm && (
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 p-5 backdrop-blur-xl">
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-4">Nova Conta</h4>
                    <div className="flex flex-col gap-3">
                        <input
                            placeholder="Nome da conta (ex: Nubank, Itaú)"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        />
                        <select
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                        >
                            {ACCOUNT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                            ))}
                        </select>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Saldo inicial"
                                value={saldoInicial}
                                onChange={(e) => setSaldoInicial(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={handleCreate}
                                disabled={saving || !nome}
                                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all"
                            >
                                {saving ? 'Criando...' : 'Criar Conta'}
                            </button>
                            <button
                                onClick={() => { setShowForm(false); setNome('') }}
                                className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
