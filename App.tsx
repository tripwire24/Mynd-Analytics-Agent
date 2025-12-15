import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { Message, ChatSession, ToolCall } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Initialize a new chat on load if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      handleNewChat();
    }
  }, []);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Analysis',
      preview: '',
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    // In a real app, we would load messages for this session ID here.
    // For this demo, we just clear messages if switching (mocking separate history)
    // Or we could store messages in a map. Let's simpler: just clear for now since no backend.
    setMessages([]);
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsStreaming(true);

    // Placeholder for AI response
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isLoading: true,
      toolCalls: []
    };
    setMessages(prev => [...prev, aiMsg]);

    // Update session title if it's the first message
    if (messages.length === 0 && currentSessionId) {
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId ? { ...s, title: currentInput.slice(0, 30) + (currentInput.length > 30 ? '...' : '') } : s
      ));
    }

    try {
      await geminiService.sendMessageStream(
        currentInput,
        (chunkText) => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === aiMsgId) {
              return { ...msg, text: msg.text + chunkText, isLoading: false };
            }
            return msg;
          }));
        },
        (toolCall: ToolCall) => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === aiMsgId) {
              const currentCalls = msg.toolCalls || [];
              // Avoid duplicates if tool call ID exists
              if (currentCalls.find(c => c.id === toolCall.id)) return msg;
              return { ...msg, toolCalls: [...currentCalls, toolCall] };
            }
            return msg;
          }));
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setMessages(prev => prev.map(msg => {
        if (msg.id === aiMsgId) {
          return { ...msg, text: `I encountered an error connecting to the analytics service.\n\nDetails: ${errorMessage}\n\nPlease check your API key and connection.`, isLoading: false };
        }
        return msg;
      }));
    } finally {
      setIsStreaming(false);
      setMessages(prev => prev.map(msg => {
        if (msg.id === aiMsgId) return { ...msg, isLoading: false };
        return msg;
      }));
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
      />
      <main className="flex-1 h-full min-w-0">
        <ChatInterface
          messages={messages}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isStreaming={isStreaming}
        />
      </main>
    </div>
  );
};

export default App;
