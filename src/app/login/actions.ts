'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/login?message=Email ou senha incorretos')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { data: signUpData, error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/login?message=Não foi possível criar a conta: ' + error.message)
    }

    if (signUpData.user?.identities?.length === 0) {
        redirect('/login?message=Este email já está cadastrado. Faça login ou recupere sua senha.')
    }

    // After successful signup, redirect or show success message
    redirect('/login?message=Conta criada com sucesso! Verifique seu email para continuar.')
}
