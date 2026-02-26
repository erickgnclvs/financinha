'use client'

import { useState } from 'react'
import QuickAddDrawer from './QuickAddDrawer'
import AIChatDrawer from './AIChatDrawer'

interface Account {
    id: string
    nome: string
    tipo: string
}

interface CreditCard {
    id: string
    nome: string
}

interface RecentTx {
    descricao: string
    valor: number
    categoria: string
    meio_pagamento: string
    account_id?: string
    credit_card_id?: string
}

export default function AIChatButton({
    categories = [],
    accounts = [],
    creditCards = [],
    recentTransactions = [],
}: {
    categories?: string[]
    accounts?: Account[]
    creditCards?: CreditCard[]
    recentTransactions?: RecentTx[]
}) {
    const [quickOpen, setQuickOpen] = useState(false)
    const [aiOpen, setAiOpen] = useState(false)

    return (
        <>
            {/* FAB — Quick Add */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
                {/* Small AI button */}
                <button
                    onClick={() => setAiOpen(true)}
                    className="w-10 h-10 bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:scale-110 transition-all text-sm font-bold"
                    title="Assistente AI"
                >
                    ✨
                </button>
                {/* Main + button */}
                <button
                    onClick={() => setQuickOpen(true)}
                    className="group w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 relative"
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 animate-ping opacity-20"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                </button>
            </div>

            <QuickAddDrawer
                isOpen={quickOpen}
                onClose={() => setQuickOpen(false)}
                categories={categories}
                accounts={accounts}
                creditCards={creditCards}
                recentTransactions={recentTransactions}
            />

            <AIChatDrawer
                isOpen={aiOpen}
                onClose={() => setAiOpen(false)}
            />
        </>
    )
}
