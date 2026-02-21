'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveTransaction(transaction: Record<string, unknown>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const { error } = await supabase
        .from('transactions')
        .insert({
            ...transaction,
            user_id: user.id
        })

    if (error) {
        console.error('Error saving transaction:', error)
        throw new Error('Failed to save transaction')
    }

    revalidatePath('/')
}
