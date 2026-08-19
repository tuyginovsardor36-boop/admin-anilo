import React from 'react';
import { MessageSquare, Settings, Info, PlusCircle, Menu } from 'lucide-react';
import { AppView, ChatSession } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onNewChat: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  onNewChat,
  isOpen,
  toggleSidebar,
  sessions,
  currentSessionId,
  onSelectSession
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Container */}
      <div className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-gray-950 border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xl">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <MessageSquare size={18} />
            </div>
            <span className="text-white tracking-tight">Nexus</span>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) toggleSidebar();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors duration-200 font-medium shadow-lg shadow-blue-900/20"
          >
            <PlusCircle size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2">
          <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">History</div>
          {sessions.length === 0 && (
             <div className="px-4 py-8 text-center text-gray-600 text-sm italic">
                No chat history yet.
             </div>
          )}
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                onSelectSession(session.id);
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors duration-200 ${
                currentSessionId === session.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              {session.title}
            </button>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="p-2 border-t border-gray-800">
          <button
            onClick={() => onChangeView(AppView.Settings)}
            className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg transition-colors ${currentView === AppView.Settings ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button
            onClick={() => onChangeView(AppView.About)}
            className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg transition-colors ${currentView === AppView.About ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
          >
            <Info size={18} />
            <span className="text-sm font-medium">About</span>
          </button>
        </div>
      </div>
    </>
  );
};