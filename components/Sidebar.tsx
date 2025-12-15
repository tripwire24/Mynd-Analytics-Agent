import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sessions, currentSessionId, onSelectSession, onNewChat }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 flex-shrink-0 border-r border-slate-800">
      {/* Header */}
      <div className="p-4">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors duration-200 group shadow-lg shadow-indigo-900/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium text-sm">New Analysis</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-2 py-2">
        <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 mt-2">History</h3>
        <div className="space-y-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 truncate ${
                currentSessionId === session.id 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'hover:bg-slate-800/50 hover:text-slate-100'
              }`}
            >
              {session.title || 'Untitled Chat'}
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-600 text-xs italic">
              No history yet.
            </div>
          )}
        </div>
      </div>

      {/* User / Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            MY
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">Mynd Admin</span>
            <span className="text-xs text-slate-500">Pro Plan</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;