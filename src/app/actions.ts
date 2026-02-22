'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveTransaction(transaction: Record<string, unknown>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    // Normalize category to ALL CAPS for consistency
    const normalizedTransaction = {
        ...transaction,
        categoria: typeof transaction.categoria === 'string'
            ? transaction.categoria.toUpperCase()
            : transaction.categoria,
        user_id: user.id,
    }

    const { error } = await supabase
        .from('transactions')
        .insert(normalizedTransaction)

    if (error) {
        console.error('Error saving transaction:', error)
        throw new Error('Failed to save transaction')
    }

    revalidatePath('/')
    revalidatePath('/transactions')
}

export async function updateTransaction(id: string, fields: Record<string, unknown>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    // Normalize category
    const normalizedFields = {
        ...fields,
        categoria: typeof fields.categoria === 'string'
            ? fields.categoria.toUpperCase()
            : fields.categoria,
    }

    const { error } = await supabase
        .from('transactions')
        .update(normalizedFields)
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating transaction:', error)
        throw new Error('Failed to update transaction')
    }

    revalidatePath('/')
    revalidatePath('/transactions')
    revalidatePath(`/transactions/${id}`)
}

export async function deleteTransaction(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting transaction:', error)
        throw new Error('Failed to delete transaction')
    }

    revalidatePath('/')
    revalidatePath('/transactions')
}
