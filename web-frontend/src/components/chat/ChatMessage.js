import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * ChatMessage — render satu bubble pesan.
 * Mendukung tampilan berbeda untuk pesan user dan respons AI.
 *
 * @param {{ sender: 'user'|'ai', text: string }} props
 */
export default function ChatMessage({ sender, text }) {
  const isUser = sender === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`p-3 max-w-[95%] text-[13px] leading-relaxed shadow-sm ${
          isUser
            ? 'bg-[#225CA9] text-white rounded-[14px] rounded-tr-[4px]'
            : 'bg-[#D1D3D4] text-[#333] rounded-[14px] rounded-tl-[4px]'
        }`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node, ...props }) => <p className="mb-0" {...props} />,
            ul: ({ node, ...props }) => (
              <ul className="list-disc ml-4 mb-2" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal ml-4 mb-2" {...props} />
            ),
            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-2">
                <table
                  className="min-w-full border-collapse border border-gray-400 text-[11px]"
                  {...props}
                />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th
                className="border border-gray-400 px-2 py-1 bg-gray-200"
                {...props}
              />
            ),
            td: ({ node, ...props }) => (
              <td className="border border-gray-400 px-2 py-1" {...props} />
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
