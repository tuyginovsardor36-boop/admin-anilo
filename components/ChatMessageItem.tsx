
import React from 'react';
import { User, Bot, AlertCircle } from 'lucide-react';
import { Message, Sender } from '../types';

interface ChatMessageItemProps {
  message: Message;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;
  const isSystem = message.sender === Sender.System;
  const isError = message.isError;

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="bg-gray-800/80 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-0.5 shadow-sm ${
          isUser ? 'bg-blue-600 ml-2' : isError ? 'bg-red-900 mr-2' : 'bg-orange-600 mr-2'
        }`}>
          {isUser ? <User size={12} className="text-white" /> : isError ? <AlertCircle size={12} className="text-red-200" /> : <Bot size={12} className="text-white" />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-3 py-2 rounded-2xl text-sm shadow-md ${
            isUser 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : isError 
                ? 'bg-red-900/40 border border-red-800 text-red-100 rounded-tl-none'
                : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
          }`}>
            <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {message.text}
            </div>
          </div>
          <span className="text-[10px] text-gray-500 mt-1 px-1 opacity-60">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
