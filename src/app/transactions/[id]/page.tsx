import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/Header'
import TransactionForm from '@/components/TransactionForm'

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!transaction) return notFound()

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/30">
            <Header showBack={true} />

            {/* Short Hero */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 rounded-b-[2.5rem] -z-0">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-5 blur-3xl"></div>
            </div>

            <div className="flex-1 pt-28 pb-12 px-4 relative z-10 flex flex-col items-center">
                <TransactionForm transaction={transaction} />
            </div>
        </div>
    )
}
