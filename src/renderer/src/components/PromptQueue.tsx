import { useState, useRef, useEffect } from 'react'
import { useMatchStore } from '../store/matchStore'

export default function PromptQueue() {
  const { prompts, setPrompts } = useMatchStore()
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    window.api.getPromptQueue().then((p) => {
      if (Array.isArray(p)) setPrompts(p as string[])
    })
    const unsub = window.api.onPromptsUpdate((p) => setPrompts(p))
    return unsub
  }, [setPrompts])

  function handleAdd() {
    if (!draft.trim()) return
    window.api.addPrompt(draft)
    setDraft('')
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleAdd()
    }
  }

  function handleDelete(index: number) {
    window.api.deletePrompt(index)
  }

  function handleCopyAll() {
    if (prompts.length) {
      navigator.clipboard.writeText(prompts.join('\n\n'))
    }
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Fix Prompts</h2>
        {prompts.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleCopyAll}
              className="text-[11px] text-white/35 hover:text-white/60 transition-colors cursor-pointer"
            >
              Copy all
            </button>
            <button
              onClick={() => window.api.clearPrompts()}
              className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a fix prompt or note..."
          rows={4}
          className="w-full bg-white/6 border border-white/12 rounded-xl px-3.5 py-3 text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-green-500/50 focus:bg-white/8 transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="self-end text-xs bg-green-600/20 border border-green-500/40 text-green-400 px-4 py-1.5 rounded-full hover:bg-green-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Add  ⌘↵
        </button>
      </div>

      {/* Queue */}
      {prompts.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-white/25 uppercase tracking-wider">{prompts.length} queued</p>
          {prompts.map((p, i) => (
            <div
              key={i}
              className="group flex items-start gap-2 bg-white/5 border border-white/8 rounded-xl px-3.5 py-3"
            >
              <span className="text-[10px] text-white/20 mt-0.5 flex-shrink-0 font-mono">#{i + 1}</span>
              <p className="flex-1 text-sm text-white/75 leading-relaxed whitespace-pre-wrap break-words min-w-0">{p}</p>
              <button
                onClick={() => handleDelete(i)}
                className="flex-shrink-0 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer text-xs mt-0.5"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {prompts.length === 0 && (
        <p className="text-center text-white/20 text-xs py-6">No prompts queued</p>
      )}
    </div>
  )
}
