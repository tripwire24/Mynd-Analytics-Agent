import React from 'react';
import { Message, ToolCall } from '../types';
import ChartWidget from './ChartWidget';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isModel = message.role === 'model';

  // Helper to process markdown-like text (simple version for this demo)
  // In a real app, use react-markdown
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <p key={i} className={`min-h-[1em] ${i > 0 ? 'mt-2' : ''}`}>
        {line}
      </p>
    ));
  };

  return (
    <div className={`flex w-full mb-6 ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isModel ? 'items-start' : 'items-end'}`}>

        {/* Author Label */}
        <span className="text-xs text-gray-400 mb-1 ml-1">
          {isModel ? 'MYND AI' : 'You'}
        </span>

        {/* Message Content */}
        <div className={`
          px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm
          ${isModel
            ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
            : 'bg-indigo-600 text-white rounded-tr-sm'
          }
        `}>
          {message.text && (
            <div className="prose prose-sm max-w-none prose-indigo prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4 border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider" {...props} />,
                  th: ({ node, ...props }) => <th className="px-4 py-3 text-left" {...props} />,
                  td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />,
                  li: ({ node, ...props }) => <li className="text-gray-700" {...props} />
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}

          {/* Tool Activities (Connecting State) */}
          {message.isLoading && (
            <div className="flex items-center space-x-2 mt-3 text-gray-400">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs font-medium">Analyzing...</span>
            </div>
          )}
        </div>

        {/* Render Charts if any */}
        {message.toolCalls && message.toolCalls.map((call) => (
          <div key={call.id} className="w-full mt-2">
            {/* Visual Cue for Data Fetching */}
            {call.name === 'get_analytics_data' && (
              <div className="flex items-center text-xs text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 w-fit mb-2">
                <svg className="w-3 h-3 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Streaming data from MCP Endpoint...
              </div>
            )}

            {/* The Chart Itself */}
            {call.name === 'render_chart' && (
              <ChartWidget config={call.args} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageBubble;
