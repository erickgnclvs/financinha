import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const getSystemPrompt = (context: {
    categories: string[]
    accounts: { id: string; nome: string; tipo: string }[]
    creditCards: { id: string; nome: string; limite: number; dia_fechamento: number; dia_vencimento: number }[]
    financialSnapshot: string
}) => `
Você é o assistente financeiro do aplicativo "Financinha". Você é inteligente, direto e conciso.
Você pode executar ações financeiras E responder perguntas sobre as finanças do usuário.

═══ DADOS DO USUÁRIO ═══

Categorias existentes: [${context.categories.join(', ') || 'Nenhuma'}]

Contas: ${context.accounts.length > 0 ? context.accounts.map(a => `${a.nome} (${a.tipo}, ID: ${a.id})`).join(', ') : 'Nenhuma conta cadastrada'}

Cartões de crédito: ${context.creditCards.length > 0 ? context.creditCards.map(c => `${c.nome} (limite: R$${c.limite}, fecha dia ${c.dia_fechamento}, vence dia ${c.dia_vencimento}, ID: ${c.id})`).join(', ') : 'Nenhum cartão cadastrado'}

Snapshot financeiro:
${context.financialSnapshot}

═══ AÇÕES DISPONÍVEIS ═══

Responda SEMPRE em JSON estrito com o campo "tipo" indicando a ação:

1. tipo: "transacao" — Registrar gasto ou receita
{
  "tipo": "transacao",
  "transacao": {
    "descricao": "Nome do gasto",
    "valor": 12.50,
    "direcao": "SAIDA" ou "ENTRADA",
    "categoria": "CATEGORIA EM MAIÚSCULAS",
    "meio_pagamento": "debito/credito/pix/dinheiro",
    "account_id": "ID da conta (se mencionada)" ou null,
    "credit_card_id": "ID do cartão (se meio_pagamento for credito)" ou null,
    "afeta_caixa": true (false se credito)
  }
}

2. tipo: "transferencia" — Transferir entre contas
{
  "tipo": "transferencia",
  "transferencia": {
    "from_account_id": "ID conta origem",
    "to_account_id": "ID conta destino",
    "valor": 1000.00,
    "descricao": "descrição curta"
  }
}

3. tipo: "pagar_fatura" — Pagar fatura do cartão
{
  "tipo": "pagar_fatura",
  "pagamento": {
    "credit_card_id": "ID do cartão",
    "from_account_id": "ID da conta que pagará",
    "valor": 500.00,
    "card_name": "Nome do cartão"
  }
}

4. tipo: "consulta" — Responder pergunta sobre finanças
{
  "tipo": "consulta",
  "resposta": "Texto com a resposta usando os dados disponíveis. Use emojis, seja claro e direto. Formate valores monetários. Pode usar múltiplas linhas."
}

5. tipo: "resumo" — Resumo financeiro (mensal/semanal/diário)
{
  "tipo": "resumo",
  "resposta": "Texto com o resumo organizado por categorias, totais, etc. Use emojis e formato claro."
}

6. tipo: "pergunta" — Quando falta informação para executar ação
{
  "tipo": "pergunta",
  "pergunta": "O que você precisa saber"
}

7. tipo: "conversa" — Conversa geral / cumprimento
{
  "tipo": "conversa",
  "resposta": "Resposta amigável e curta"
}

═══ REGRAS ═══

- Se o usuário NÃO especificar se é gasto ou receita, assuma SAIDA (gasto).
- Se NÃO especificar meio de pagamento, use "debito".
- Se disser "no crédito" ou "no cartão", use "credito" e preencha credit_card_id (use o primeiro cartão se não especificar qual). Quando for crédito, afeta_caixa = false.
- Se disser "pix", use "pix".
- Categorias SEMPRE em MAIÚSCULAS. Prefira existentes.
- Apenas ENTRADA se o usuário mencionar explicitamente recebimento/salário/renda.
- Para transferências, identifique contas pelo nome. Se ambíguo, pergunte.
- Para pagar fatura, use a primeira conta como padrão se não especificada.
- Para consultas, responda com base nos dados do snapshot. Nunca invente dados.
- Para resumos, organize por categoria com valores e percentuais quando possível.
- Se não souber algo, diga que não tem dados suficientes.
- NUNCA inclua texto fora do JSON.
- NÃO envolva com \`\`\`json.
`

export async function POST(req: Request) {
    try {
        const { message, context = [] } = await req.json()

        if (!process.env.OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'OpenRouter API Key not configured' }, { status: 500 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Fetch categories
        let existingCategories: string[] = []
        if (user) {
            const { data } = await supabase
                .from('transactions')
                .select('categoria')
                .limit(500)
            if (data) {
                existingCategories = Array.from(
                    new Set(data.map(t => String(t.categoria)).filter(c => c && c !== 'null' && c !== 'undefined'))
                )
            }
        }

        // Fetch accounts
        const { data: accounts } = await supabase
            .from('accounts')
            .select('id, nome, tipo, saldo_inicial')
            .order('created_at', { ascending: true })

        // Fetch credit cards
        const { data: creditCards } = await supabase
            .from('credit_cards')
            .select('id, nome, limite, dia_fechamento, dia_vencimento')
            .order('created_at', { ascending: true })

        // Build financial snapshot
        const now = new Date()
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const today = now.toISOString().split('T')[0]

        // Current month transactions
        const { data: currentMonthTx } = await supabase
            .from('transactions')
            .select('*')
            .gte('data', currentMonthStart)
            .order('data', { ascending: false })

        // Last month transactions (for comparisons)
        const { data: lastMonthTx } = await supabase
            .from('transactions')
            .select('valor, direcao, categoria, afeta_caixa')
            .gte('data', lastMonthStart)
            .lte('data', lastMonthEnd)

        // Build snapshot text
        const thisMonthExpenses = (currentMonthTx || [])
            .filter(t => t.direcao === 'SAIDA')
            .reduce((s, t) => s + Number(t.valor), 0)
        const thisMonthIncome = (currentMonthTx || [])
            .filter(t => t.direcao === 'ENTRADA')
            .reduce((s, t) => s + Number(t.valor), 0)
        const thisMonthCashExpenses = (currentMonthTx || [])
            .filter(t => t.direcao === 'SAIDA' && t.afeta_caixa !== false)
            .reduce((s, t) => s + Number(t.valor), 0)
        const lastMonthExpenses = (lastMonthTx || [])
            .filter(t => t.direcao === 'SAIDA')
            .reduce((s, t) => s + Number(t.valor), 0)

        // Category breakdown this month
        const categoryMap = new Map<string, number>()
            ; (currentMonthTx || []).filter(t => t.direcao === 'SAIDA').forEach(t => {
                const cat = String(t.categoria)
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(t.valor))
            })
        const topCategories = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([cat, val]) => `  ${cat}: R$ ${val.toFixed(2)}`)
            .join('\n')

        // Week spending
        const weekTx = (currentMonthTx || []).filter(t => t.data >= weekAgo && t.direcao === 'SAIDA')
        const weekTotal = weekTx.reduce((s, t) => s + Number(t.valor), 0)

        // Today spending
        const todayTx = (currentMonthTx || []).filter(t => t.data === today && t.direcao === 'SAIDA')
        const todayTotal = todayTx.reduce((s, t) => s + Number(t.valor), 0)

        // Account balances
        const accountBalances = (accounts || []).map(acc => {
            const allAccTx = (currentMonthTx || []).filter(t => t.account_id === acc.id)
            // For proper balance we'd need all-time tx, but this gives a good approximation
            return `  ${acc.nome}: saldo_inicial R$ ${acc.saldo_inicial}`
        }).join('\n')

        // Credit card bills (all unpaid)
        const { data: creditTx } = await supabase
            .from('transactions')
            .select('credit_card_id, valor')
            .not('credit_card_id', 'is', null)

        const cardBills = (creditCards || []).map(card => {
            const bill = (creditTx || [])
                .filter(t => t.credit_card_id === card.id)
                .reduce((s, t) => s + Number(t.valor), 0)
            return `  ${card.nome}: fatura R$ ${bill.toFixed(2)} (limite R$ ${card.limite})`
        }).join('\n')

        // Recent transactions (last 5)
        const recent = (currentMonthTx || []).slice(0, 5)
            .map(t => `  ${t.data} | ${t.descricao} | R$ ${Number(t.valor).toFixed(2)} | ${t.direcao} | ${t.categoria}`)
            .join('\n')

        const financialSnapshot = `
Data de hoje: ${today}
Mês atual: ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}

💰 Receitas este mês: R$ ${thisMonthIncome.toFixed(2)}
💸 Gastos totais este mês: R$ ${thisMonthExpenses.toFixed(2)}
💵 Gastos que afetam caixa: R$ ${thisMonthCashExpenses.toFixed(2)}
📊 Gastos mês passado: R$ ${lastMonthExpenses.toFixed(2)}
📅 Gastos últimos 7 dias: R$ ${weekTotal.toFixed(2)}
📌 Gastos hoje: R$ ${todayTotal.toFixed(2)}

📂 Gastos por categoria (mês atual):
${topCategories || '  Nenhum gasto registrado'}

🏦 Contas:
${accountBalances || '  Nenhuma conta'}

💳 Cartões de crédito:
${cardBills || '  Nenhum cartão'}

📋 Transações recentes:
${recent || '  Nenhuma transação'}`

        const messages = [
            {
                role: 'system',
                content: getSystemPrompt({
                    categories: existingCategories,
                    accounts: (accounts || []).map(a => ({ id: a.id, nome: a.nome, tipo: a.tipo })),
                    creditCards: (creditCards || []).map(c => ({ id: c.id, nome: c.nome, limite: c.limite, dia_fechamento: c.dia_fechamento, dia_vencimento: c.dia_vencimento })),
                    financialSnapshot,
                })
            },
            ...context,
            { role: 'user', content: message }
        ]

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://financinha.app',
                'X-Title': 'Financinha',
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages,
                response_format: { type: 'json_object' }
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('OpenRouter Error:', errorText)
            return NextResponse.json({ error: 'Failed to fetch from OpenRouter' }, { status: 500 })
        }

        const data = await response.json()
        const content = data.choices[0].message.content

        let parsed
        try {
            parsed = JSON.parse(content)
        } catch {
            console.error("Failed to parse JSON:", content)
            return NextResponse.json({ error: 'Invalid JSON from AI' }, { status: 500 })
        }

        return NextResponse.json(parsed)
    } catch (error: Error | unknown) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}
