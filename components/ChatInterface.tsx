import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, input, setInput, onSend, isStreaming }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center px-6 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">Model:</span>
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md font-semibold">Gemini 1.5 Pro</span>
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            MCP Active
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Mynd Analytics AI</h2>
              <p className="text-center max-w-md mb-8">
                Ask me anything about MYND's performance. I can visualize user trends, revenue, and conversion data directly from the MCP Endpoint.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                <button onClick={() => setInput("Show me active users for the last 30 days")} className="text-sm p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left text-gray-600">
                  "Show active users last 30 days"
                </button>
                <button onClick={() => setInput("Compare mobile vs desktop revenue")} className="text-sm p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left text-gray-600">
                  "Compare mobile vs desktop revenue"
                </button>
                <button onClick={() => setInput("What is our current conversion rate trend?")} className="text-sm p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left text-gray-600">
                  "Conversion rate trend?"
                </button>
                <button onClick={() => setInput("Analyze traffic sources for last week")} className="text-sm p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left text-gray-600">
                  "Analyze traffic sources"
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your analytics..."
            className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none shadow-sm text-gray-700 placeholder-gray-400"
            rows={1}
            style={{ minHeight: '60px' }}
            disabled={isStreaming}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || isStreaming}
            className={`absolute right-3 top-3 p-2 rounded-xl transition-all duration-200 ${input.trim() && !isStreaming
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            {isStreaming ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-gray-400">AI can make mistakes. Please verify important data.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;