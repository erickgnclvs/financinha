'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCreditCard(data: { nome: string; limite: number; dia_fechamento: number; dia_vencimento: number }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const { error } = await supabase
        .from('credit_cards')
        .insert({ ...data, user_id: user.id })

    if (error) throw new Error('Failed to create credit card')
    revalidatePath('/credit-cards')
    revalidatePath('/')
}

export async function deleteCreditCard(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) throw new Error('Failed to delete credit card')
    revalidatePath('/credit-cards')
    revalidatePath('/')
}

export async function createAccount(data: { nome: string; tipo: string; saldo_inicial: number }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const { error } = await supabase
        .from('accounts')
        .insert({ ...data, user_id: user.id })

    if (error) throw new Error('Failed to create account')
    revalidatePath('/accounts')
    revalidatePath('/')
}

export async function deleteAccount(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) throw new Error('Failed to delete account')
    revalidatePath('/accounts')
    revalidatePath('/')
}

export async function transferBetweenAccounts(data: {
    from_account_id: string
    to_account_id: string
    valor: number
    descricao: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const today = new Date().toISOString().split('T')[0]

    // Create SAIDA from source account
    const { error: e1 } = await supabase.from('transactions').insert({
        user_id: user.id,
        data: today,
        descricao: `Transferência: ${data.descricao}`,
        valor: data.valor,
        direcao: 'SAIDA',
        categoria: 'TRANSFERENCIA',
        meio_pagamento: 'transferencia',
        account_id: data.from_account_id,
    })
    if (e1) throw new Error('Failed to create transfer out')

    // Create ENTRADA to destination account
    const { error: e2 } = await supabase.from('transactions').insert({
        user_id: user.id,
        data: today,
        descricao: `Transferência: ${data.descricao}`,
        valor: data.valor,
        direcao: 'ENTRADA',
        categoria: 'TRANSFERENCIA',
        meio_pagamento: 'transferencia',
        account_id: data.to_account_id,
    })
    if (e2) throw new Error('Failed to create transfer in')

    revalidatePath('/accounts')
    revalidatePath('/')
}

export async function payCreditCard(data: {
    credit_card_id: string
    from_account_id: string
    valor: number
    card_name: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const today = new Date().toISOString().split('T')[0]

    // Create SAIDA from source account (paying the card bill)
    const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        data: today,
        descricao: `Pagamento fatura: ${data.card_name}`,
        valor: data.valor,
        direcao: 'SAIDA',
        categoria: 'CARTAO',
        meio_pagamento: 'transferencia',
        account_id: data.from_account_id || null,
    })
    if (error) throw new Error('Failed to pay credit card')

    revalidatePath('/credit-cards')
    revalidatePath('/accounts')
    revalidatePath('/')
}
