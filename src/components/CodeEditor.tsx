import { FileNode } from '../types';

interface CodeEditorProps {
  file: FileNode | null;
  onRun: () => void;
}

export default function CodeEditor({ file, onRun }: CodeEditorProps) {
  return (
    <div className="flex-1 bg-slate-900 text-white flex flex-col p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-slate-300">{file?.name || 'Select a file'}</h2>
        <div className="flex gap-2">
          <button onClick={onRun} className="bg-green-600 px-3 py-1 rounded text-sm">Run Bot</button>
          <button className="bg-red-600 px-3 py-1 rounded text-sm">Stop</button>
        </div>
      </div>
      <pre className="flex-1 overflow-auto bg-black p-4 rounded font-mono text-sm">
        {file?.content || '// Select a file to edit'}
      </pre>
    </div>
  );
}
