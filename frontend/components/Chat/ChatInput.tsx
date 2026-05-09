'use client';
import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (msg: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const msg = value.trim();
    if (!msg || disabled) return;
    onSend(msg);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div className="flex items-end gap-2 bg-gray-800 border border-gray-700 rounded-2xl p-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => {
          setValue(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        onKeyDown={onKey}
        placeholder="Ask about any stock, ETF, or portfolio…"
        disabled={disabled}
        rows={1}
        className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none outline-none max-h-40"
      />
      <button onClick={submit} disabled={!value.trim() || disabled}
        className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <Send size={16} className="text-white" />
      </button>
    </div>
  );
}
