import { useRef, useEffect } from 'react';
import { BsArrowRightCircleFill } from 'react-icons/bs';

/**
 * ChatInput — textarea auto-resize dengan tombol kirim.
 *
 * @param {{
 *   inputText: string,
 *   setInputText: Function,
 *   onSend: Function,
 *   onKeyDown: Function,
 *   isLoading: boolean
 * }} props
 */
export default function ChatInput({ inputText, setInputText, onSend, onKeyDown, isLoading }) {
  const textareaRef = useRef(null);

  // Auto-resize textarea sesuai konten (max 120px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [inputText]);

  return (
    <div className="p-4 pt-2">
      <div className="relative bg-[#D3D2D3] rounded-[20px] flex items-end pr-1 pb-1 border border-white/40 min-h-[40px]">
        <textarea
          ref={textareaRef}
          rows={1}
          className="w-full bg-transparent text-[13px] text-neutral-80 px-3 py-2.5 outline-none resize-none placeholder:text-neutral-50 overflow-y-auto flex items-center"
          placeholder="Tanyakan apapun..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          onClick={onSend}
          className={`rounded-full p-[6px] transition-colors ${inputText.trim()
              ? 'text-[#225CA9] hover:text-[#184481]'
              : 'text-neutral-50 cursor-not-allowed'
            }`}
          disabled={!inputText.trim() || isLoading}
        >
          <BsArrowRightCircleFill size={24} />
        </button>
      </div>
    </div>
  );
}
