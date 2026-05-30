import type { Message } from '@/lib/types';
import { Badge } from '@/components/UI/Badge';
import ReactMarkdown from 'react-markdown';

export function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'
      }`}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        ) : (
          <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-semibold prose-headings:mb-1 prose-headings:mt-3
            prose-p:text-gray-200 prose-p:my-1
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:my-1 prose-ul:pl-4 prose-li:text-gray-200 prose-li:my-0.5
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-blue-500 prose-blockquote:text-gray-400
            prose-code:text-blue-300 prose-code:bg-gray-900 prose-code:px-1 prose-code:rounded">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
        {msg.citations && msg.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-700">
            {msg.citations.map((c, i) => (
              <Badge
                key={i}
                label={c.ref}
                variant={c.type === 'filing' ? 'blue' : c.type === 'news' ? 'yellow' : 'green'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
