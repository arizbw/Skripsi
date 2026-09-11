import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

/**
 * ChatWindow — menampilkan daftar pesan dan mengelola auto-scroll.
 *
 * @param {{
 *   messages: Array<{sender: string, text: string}>,
 *   isLoading: boolean,
 *   isLoadingHistory: boolean
 * }} props
 */
export default function ChatWindow({ messages, isLoading, isLoadingHistory }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4 space-y-4">
      {isLoadingHistory ? (
        <div className="flex justify-center items-center h-20 text-[12px] text-gray-500">
          Memuat histori chat...
        </div>
      ) : (
        messages.map((msg, idx) => (
          <ChatMessage key={idx} sender={msg.sender} text={msg.text} />
        ))
      )}

      {isLoading && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}
