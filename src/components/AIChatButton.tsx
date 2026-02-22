'use client'

import { useState } from 'react'
import AIChatDrawer from './AIChatDrawer'

export default function AIChatButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setIsOpen(true)}
                    className="group w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 relative"
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 animate-ping opacity-20"></div>
                    <span className="text-xl relative z-10">✨</span>
                </button>
            </div>

            <AIChatDrawer
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    )
}
