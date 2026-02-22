import { NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

const getSystemPrompt = (categories: string[]) => `
Você é o assistente financeiro do aplicativo "Financinha".
Seu objetivo é ler as mensagens do usuário e extrair os dados financeiros no formato JSON estrito.
Se a mensagem for muito vaga ou faltar informações cruciais (como valor), pergunte de volta para esclarecer.

Categorias já existentes no sistema do usuário:
[ ${categories.length > 0 ? categories.join(', ') : 'Nenhuma'} ]

Regra de Categoria:
SEMPRE prefira usar uma das "Categorias já existentes" listadas acima se o gasto se encaixar minimamente (ex: se a pessoa gastou com estacionamento e existe a categoria "Carro", use "Carro"). Crie uma nova categoria apenas se o gasto for completamente diferente das opções existentes.

Formato retornado em JSON:
{
  "tipo": "transacao" ou "pergunta",
  "pergunta": "Se tipo for pergunta, coloque aqui o que deseja perguntar",
  "transacao": {
    "descricao": "Nome do gasto ou ganho",
    "valor": 12.50, // sempre número positivo
    "direcao": "SAIDA" ou "ENTRADA" ou "INFO",
    "categoria": "Nome da categoria preferencialmente escolhida da lista existente",
    "meio_pagamento": "credito, debito, pix, dinheiro, etc"
  }
}

Importante:
- Se o usuário não mencionar a data, assuma que foi hoje (mas não precisa retornar a data no JSON, o sistema fará isso).
- Responda apenas e estritamente com o objeto JSON. Não inclua texto fora do JSON. Não envolva com \`\`\`json.
`

export async function POST(req: Request) {
    try {
        const { message, context = [] } = await req.json()

        if (!process.env.OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'OpenRouter API Key not configured' }, { status: 500 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        let existingCategories: string[] = []
        if (user) {
            const { data } = await supabase
                .from('transactions')
                .select('categoria')
                .limit(200)

            if (data) {
                existingCategories = Array.from(
                    new Set(data.map(t => String(t.categoria)).filter(c => c && c !== 'null' && c !== 'Outros' && c !== 'undefined'))
                )
            }
        }

        const messages = [
            { role: 'system', content: getSystemPrompt(existingCategories) },
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
                messages: messages,
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

        // Try parsing
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
