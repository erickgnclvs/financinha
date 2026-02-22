import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import BudgetManager from '@/components/BudgetManager'

export default async function BudgetsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    // Fetch budgets
    const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .order('categoria', { ascending: true })

    // Fetch this month's expenses
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('direcao', 'SAIDA')
        .gte('data', monthStart)

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/30">
            <Header showBack={true} />

            {/* Short Hero */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 rounded-b-[2.5rem] -z-0">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-5 blur-3xl"></div>
            </div>

            <div className="flex-1 pt-24 pb-12 px-4 relative z-10 max-w-5xl mx-auto w-full">
                <div className="mb-6">
                    <h1 className="text-3xl font-black text-white tracking-tight">Orçamentos</h1>
                    <p className="text-sm font-medium text-purple-200 mt-1">Controle seus limites de gasto por categoria</p>
                </div>

                <div className="mt-8">
                    <BudgetManager budgets={budgets || []} transactions={transactions || []} />
                </div>
            </div>
        </div>
    )
}
