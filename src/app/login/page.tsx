import { login, signup } from './actions'

export default async function LoginPage(props: {
    searchParams: Promise<{ message?: string }>
}) {
    const searchParams = await props.searchParams
    return (
        <div className="flex-1 flex flex-col w-full min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/30 font-sans relative overflow-hidden">

            {/* Background elements */}
            <div className="absolute top-0 right-0 -tr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -bl-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl"></div>

            <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto relative z-10 my-auto">
                <form className="flex-1 flex flex-col w-full justify-center text-foreground">
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mx-auto mb-6 transform -rotate-6">
                            <span className="text-3xl font-black">F</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">Financinha.</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Sua vida financeira, simplificada pela IA.</p>
                    </div>

                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-black/50 border border-white/50 dark:border-zinc-800/50 flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1" htmlFor="email">
                                Email
                            </label>
                            <input
                                className="rounded-2xl px-5 py-4 bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-zinc-400"
                                name="email"
                                type="email"
                                placeholder="voce@exemplo.com"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2 mb-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300" htmlFor="password">
                                    Senha
                                </label>
                            </div>
                            <input
                                className="rounded-2xl px-5 py-4 bg-zinc-50 dark:bg-zinc-950/50 border-2 border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-zinc-400"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-3 mt-2">
                            <button
                                formAction={login}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl px-4 py-4 font-bold shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 transition-all text-base"
                            >
                                Entrar na conta
                            </button>
                            <button
                                formAction={signup}
                                className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-2xl px-4 py-4 transition-all hover:-translate-y-0.5"
                            >
                                Criar nova conta
                            </button>
                        </div>
                    </div>

                    {searchParams?.message && (
                        <p className={`mt-4 p-4 font-medium text-center rounded-md ${searchParams.message.includes('Check email') || searchParams.message.includes('sucesso') || searchParams.message.includes('Verifique')
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {searchParams.message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}
