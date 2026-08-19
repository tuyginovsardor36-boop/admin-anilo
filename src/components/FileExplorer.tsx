import { FileNode } from '../types';

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
}

export default function FileExplorer({ files, onFileSelect }: FileExplorerProps) {
  return (
    <div className="w-1/6 border-r p-4 bg-white">
      <h2 className="font-semibold mb-4">Files</h2>
      <ul className="space-y-2">
        {files.map(file => (
          <li key={file.name} className="cursor-pointer hover:text-blue-600" onClick={() => onFileSelect(file)}>
            {file.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
