import { ChatWindow } from '@/components/Chat/ChatWindow';

export default function Home() {
  return (
    <div className="h-[calc(100vh-3.5rem-3rem)] flex flex-col">
      <ChatWindow />
    </div>
  );
}
