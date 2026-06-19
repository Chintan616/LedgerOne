import { useState, useRef, useEffect } from 'react'
import { sendMessage } from '../api/chat'

const SUGGESTIONS = [
  'Which client owes me the most?',
  "What's my profit this month?",
  'Show my overdue invoices',
  'Total expenses by category',
]

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [messages, isOpen])

  const handleSend = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages((p) => [...p, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await sendMessage(msg, conversationId)
      setConversationId(res.data.conversationId)
      setMessages((p) => [...p, { role: 'bot', text: res.data.reply }])
    } catch {
      setMessages((p) => [...p, { role: 'bot', text: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 flex flex-col bg-white dark:bg-[#132030] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/[0.08] overflow-hidden"
          style={{ height: '420px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-400 rounded-full" />
              <span className="text-white text-sm font-semibold">LedgerOne AI</span>
            </div>
            <button onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors" aria-label="Close">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center text-center pt-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-[#8b90b4] mb-3">Ask anything about your finances</p>
                <div className="flex flex-col gap-1.5 w-full">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => handleSend(s)}
                      className="text-xs text-left px-3 py-1.5 rounded-lg border transition-colors
                        bg-gray-50 dark:bg-white/[0.04] hover:bg-blue-50 dark:hover:bg-blue-500/10
                        border-gray-200 dark:border-white/[0.08]
                        text-gray-600 dark:text-[#8b90b4] hover:text-blue-700 dark:hover:text-blue-300">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-none'
                    : 'bg-gray-100 dark:bg-white/[0.06] text-gray-800 dark:text-gray-200 rounded-bl-none'
                }`}
                  style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' } : {}}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-white/[0.06] px-3 py-3 rounded-xl rounded-bl-none">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <div key={delay} className="w-2 h-2 bg-gray-400 dark:bg-[#8b90b4] rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-white/[0.06] flex gap-2 shrink-0">
            <input
              ref={inputRef} type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your finances..."
              disabled={loading}
              className="flex-1 text-sm rounded-lg px-3 py-2
                bg-gray-50 dark:bg-white/[0.05]
                border border-gray-200 dark:border-white/[0.08]
                text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-[#8b90b4]
                focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500
                disabled:opacity-50"
            />
            <button onClick={() => handleSend()} disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="h-12 w-12 rounded-full shadow-lg text-white flex items-center justify-center transition-transform hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}
        aria-label={isOpen ? 'Close chat' : 'Open AI chat'}
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  )
}
