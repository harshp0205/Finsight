import type { Message } from '@/lib/types';
import { Badge } from '@/components/UI/Badge';

export function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'
      }`}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        {msg.citations && msg.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-700">
            {msg.citations.map((c, i) => (
              <Badge key={i} label={c.ref} variant={c.type === 'filing' ? 'blue' : c.type === 'news' ? 'yellow' : 'green'} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
