'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Spinner } from '@/components/UI/Spinner';
import { chatStream } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Message } from '@/lib/types';

export function ChatWindow() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!token) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', created_at: new Date().toISOString() }]);

    try {
      const res = await chatStream(text, convId, token);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const raw = line.slice(5).trim();
            try {
              const payload = JSON.parse(raw);
              if ('text' in payload) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: m.content + payload.text } : m
                ));
              } else if ('citations' in payload) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, citations: payload.citations } : m
                ));
              } else if ('id' in payload) {
                setConvId(payload.id);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: 'Error: could not get a response.' } : m
      ));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-gray-500">
            <p className="text-xl font-semibold text-gray-300">Ask FinSight anything</p>
            <p className="text-sm">e.g. "Is AAPL a good buy?" · "Compare NVDA vs AMD" · "MSFT earnings outlook"</p>
          </div>
        )}
        {messages.map(m => <ChatMessage key={m.id} msg={m} />)}
        {streaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-800 rounded-2xl px-4 py-3">
              <Spinner size="sm" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t border-gray-800">
        <ChatInput onSend={send} disabled={streaming || !token} />
        {!token && <p className="text-xs text-gray-500 text-center mt-2">Sign in to use AI chat</p>}
      </div>
    </div>
  );
}
