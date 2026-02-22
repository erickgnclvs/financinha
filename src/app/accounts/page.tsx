import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import AccountManager from '@/components/AccountManager'

export default async function AccountsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true })

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .not('account_id', 'is', null)

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/30">
            <Header showBack={true} />

            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 rounded-b-[2.5rem] -z-0">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-5 blur-3xl"></div>
            </div>

            <div className="flex-1 pt-24 pb-12 px-4 relative z-10 max-w-5xl mx-auto w-full">
                <div className="mb-6">
                    <h1 className="text-3xl font-black text-white tracking-tight">Contas</h1>
                    <p className="text-sm font-medium text-blue-200 mt-1">Gerencie suas contas bancárias e investimentos</p>
                </div>

                <div className="mt-8">
                    <AccountManager accounts={accounts || []} transactions={transactions || []} />
                </div>
            </div>
        </div>
    )
}
