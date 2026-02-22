'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBudget(data: { categoria: string; limite: number }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const { error } = await supabase
        .from('budgets')
        .insert({
            categoria: data.categoria.toUpperCase(),
            limite: data.limite,
            user_id: user.id,
        })

    if (error) {
        console.error('Error creating budget:', error)
        throw new Error('Failed to create budget')
    }

    revalidatePath('/budgets')
    revalidatePath('/')
}

export async function deleteBudget(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting budget:', error)
        throw new Error('Failed to delete budget')
    }

    revalidatePath('/budgets')
    revalidatePath('/')
}
