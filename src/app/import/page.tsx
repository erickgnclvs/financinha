'use client'

import { useState } from 'react'
import { saveTransaction } from '@/app/actions'
import Header from '@/components/Header'

export default function ImportPage() {
    const [csvContent, setCsvContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<string | null>(null)

    const handleImport = async () => {
        if (!csvContent) return
        setLoading(true)
        setResult(null)

        try {
            const lines = csvContent.trim().split('\n')
            // Skip header (assuming format Data,Descricao,Valor,Direcao,Afeta_Caixa,Categoria,Meio_Pagamento,Observacoes)
            const dataLines = lines.slice(1)

            let successCount = 0

            for (const line of dataLines) {
                const parts = line.split(',')
                if (parts.length >= 4) {
                    const [data, descricao, valorStr, direcao, afeta_caixa, categoria, meio_pagamento, observacoes] = parts

                    await saveTransaction({
                        data,
                        descricao,
                        valor: parseFloat(valorStr),
                        direcao,
                        afeta_caixa: afeta_caixa === 'Sim',
                        categoria: categoria || null,
                        meio_pagamento: meio_pagamento || null,
                        observacoes: observacoes || null
                    })
                    successCount++
                }
            }

            setResult(`${successCount} transações importadas com sucesso!`)
            setCsvContent('')
        } catch (e: Error | unknown) {
            setResult(`Erro: ${e instanceof Error ? e.message : 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/30">
            <Header showBack={true} />

            {/* Short Hero Background for aesthetic consistency */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 rounded-b-[2.5rem] -z-0">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-5 blur-3xl"></div>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center pt-28 relative z-10">
                <div className="w-full max-w-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-zinc-800/50 p-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">Importar Dados</h1>
                    </div>

                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-8 ml-16">
                        Cole o conteúdo do seu CSV abaixo. Formato esperado:<br />
                        <code className="bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded-md text-[11px] mt-2 block font-mono text-indigo-600 dark:text-indigo-400 font-bold tracking-tight">Data,Descricao,Valor,Direcao,Afeta_Caixa,Categoria,Meio_Pagamento,Observacoes</code>
                    </p>

                    <textarea
                        className="w-full h-64 p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-sm mb-6 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-zinc-400 resize-none font-mono"
                        placeholder="Cole o arquivo CSV aqui..."
                        value={csvContent}
                        onChange={(e) => setCsvContent(e.target.value)}
                    />

                    <button
                        onClick={handleImport}
                        disabled={!csvContent || loading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold tracking-wide shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 transition-all text-lg"
                    >
                        {loading ? 'Processando dados...' : 'Importar transações'}
                    </button>

                    {result && (
                        <div className="mt-4 p-4 rounded-xl bg-green-50 text-green-700 text-center font-medium">
                            {result}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
