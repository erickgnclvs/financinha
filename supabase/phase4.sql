-- Phase 4: Accounts & Credit Cards
-- Run this in your Supabase SQL Editor

-- 1. Accounts table (checking, savings, investments)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'corrente',
    saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
    cor TEXT DEFAULT '#3b82f6',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_select" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "accounts_delete" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- 2. Credit cards table
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    limite DECIMAL(10,2) NOT NULL DEFAULT 0,
    dia_fechamento INT NOT NULL DEFAULT 7,
    dia_vencimento INT NOT NULL DEFAULT 15,
    cor TEXT DEFAULT '#8b5cf6',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cards_select" ON credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cards_insert" ON credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cards_update" ON credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cards_delete" ON credit_cards FOR DELETE USING (auth.uid() = user_id);

-- 3. Add optional reference columns to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL;
