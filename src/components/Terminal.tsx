interface TerminalProps {
  logs: string[];
}

export default function Terminal({ logs }: TerminalProps) {
  return (
    <div className="h-40 bg-black text-green-400 p-4 font-mono text-xs overflow-auto border-t border-slate-700">
      {logs.map((log, i) => <div key={i}>{log}</div>)}
    </div>
  );
}
