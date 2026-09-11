/**
 * TypingIndicator — ditampilkan saat AI agent masih memproses respons.
 * 
 */
export default function TypingIndicator() {
  return (
    <div className="flex flex-col items-start">
      <div className="p-3 max-w-[95%] text-[13px] leading-relaxed shadow-sm bg-[#D1D3D4] text-[#333] rounded-[14px] rounded-tl-[4px] animate-pulse">
        Berpikir...
      </div>
    </div>
  );
}
