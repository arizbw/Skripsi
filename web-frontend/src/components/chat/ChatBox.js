import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BsXLg,
  BsPlusLg,
  BsClockHistory,
  BsTrash,
} from 'react-icons/bs';
import { useChat } from '../../hooks/useChat';
import { Modal } from '../Modal';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';

/**
 * ChatBox — smart container yang mengatur semua state chat.
 * Meng-compose ChatWindow, ChatInput, dan panel histori sesi.
 *
 * @param {{ onClose: Function }} props
 */
export default function ChatBox({ onClose }) {
  const navigate = useNavigate();
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const {
    messages,
    sessions,
    activeSessionId,
    showSessionsPanel,
    inputText,
    isLoading,
    isLoadingHistory,
    isLoadingSessions,
    setInputText,
    setShowSessionsPanel,
    handleSend,
    handleKeyDown,
    handleNewChat,
    handleSelectSession,
    handleDeleteSession,
  } = useChat(navigate);

  const requestDeleteSession = (event, sessionId) => {
    event.stopPropagation();
    setSessionToDelete(sessionId);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    await handleDeleteSession(null, sessionToDelete);
    setSessionToDelete(null);
  };

  return (
    <div
      className={`h-full ${
        showSessionsPanel ? 'w-[400px]' : 'w-[300px]'
      } flex-shrink-0 bg-[#E8EAEF] shadow-[-4px_0_15px_rgba(0,0,0,0.05)] border-l border-neutral-30 flex z-[60] font-sans transition-all duration-300`}
    >
      {/* ── Side Sessions Panel (Histori) ── */}
      {showSessionsPanel && (
        <div className="w-[140px] bg-[#D8DCE5] border-r border-gray-300 flex flex-col h-full">
          <div className="px-3 pt-4 pb-3 border-b border-gray-300 flex items-center justify-between">
            <span className="text-[16px] font-bold text-[#1F54A3]">Histori</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingSessions ? (
              <div className="text-[11px] text-gray-500 text-center py-4">Memuat...</div>
            ) : sessions.length === 0 ? (
              <div className="text-[11px] text-gray-500 text-center py-4">Belum ada sesi</div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`group flex items-center justify-between p-2 rounded cursor-pointer text-[11px] transition-colors ${
                    s.session_id === activeSessionId
                      ? 'bg-[#1F54A3] text-white font-semibold'
                      : 'bg-white/60 text-gray-700 hover:bg-white'
                  }`}
                >
                  <div className="truncate flex-1 pr-1" title={s.title || 'Sesi Chat'}>
                    {s.title || 'Sesi Chat'}
                  </div>
                  <button
                    onClick={(e) => requestDeleteSession(e, s.session_id)}
                    className={`opacity-0 group-hover:opacity-100 ${
                      s.session_id === activeSessionId ? 'text-white' : 'text-red-500'
                    } hover:text-red-700 transition-opacity`}
                    title="Hapus Sesi"
                  >
                    <BsTrash size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Modal
        variant="danger"
        isOpen={sessionToDelete !== null}
        closeModal={() => setSessionToDelete(null)}
        title="Hapus histori chat?"
        description="Histori chat ini akan dihapus dan tidak dapat dipulihkan."
        leftButtonText="Batal"
        rightButtonText="Hapus"
        onClickRight={confirmDeleteSession}
      />

      {/* ── Main Chat Panel ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/50 bg-[#E8EAEF]">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSessionsPanel(!showSessionsPanel)}
              className="p-1.5 rounded-md text-[#1F54A3] hover:bg-white/50 transition-colors flex items-center space-x-1"
              title={showSessionsPanel ? 'Sembunyikan Sesi' : 'Lihat Histori Sesi'}
            >
              <BsClockHistory size={16} />
            </button>
            <h3 className="font-bold text-[#1F54A3] text-[16px]">AI Assistant</h3>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleNewChat}
              className="p-1.5 text-[#1F54A3] hover:bg-white/50 rounded-md transition-colors"
              title="Chat Baru"
            >
              <BsPlusLg size={16} />
            </button>
            <button
              onClick={onClose}
              className="text-neutral-50 hover:text-neutral-80 transition-colors p-1"
            >
              <BsXLg size={16} className="stroke-[0.5px]" />
            </button>
          </div>
        </div>

        {/* Message List */}
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          isLoadingHistory={isLoadingHistory}
        />

        {/* Input Area */}
        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
