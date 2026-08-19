import { useState } from 'react';
import AgentPanel from './components/AgentPanel';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import Terminal from './components/Terminal';
import { FileNode } from './types';

const mockFiles: FileNode[] = [
  { name: 'main.py', content: 'print("Hello World")', language: 'python' },
  { name: 'database.py', content: 'db = connect()', language: 'python' },
];

export default function App() {
  const [activeFile, setActiveFile] = useState<FileNode | null>(mockFiles[0]);
  const [logs, setLogs] = useState<string[]>(['System initialized...']);

  const runBot = () => {
    setLogs(prev => [...prev, '⚡ Bot ishga tushmoqda...', 'Execution finished.']);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 font-sans">
      <header className="p-4 border-b bg-white font-semibold text-xl flex items-center gap-2">
        <div className="w-8 h-8 bg-slate-900 rounded-lg"></div>
        Intelektai Studio
      </header>
      <div className="flex flex-1 overflow-hidden">
        <AgentPanel />
        <FileExplorer files={mockFiles} onFileSelect={setActiveFile} />
        <div className="flex-1 flex flex-col">
            <CodeEditor file={activeFile} onRun={runBot} />
            <Terminal logs={logs} />
        </div>
      </div>
    </div>
  );
}
