'use client'

import { useState } from 'react'
import AIChatDrawer from './AIChatDrawer'
import { saveTransaction } from '@/app/actions'

export default function AIChatButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-105 transition-transform"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path></svg>
                </button>
            </div>

            <AIChatDrawer
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSaveTransaction={saveTransaction}
            />
        </>
    )
}
