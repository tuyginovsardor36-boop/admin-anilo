
import React from 'react';

interface ResponseDisplayProps {
  text: string;
}

// A simple markdown-to-HTML renderer for this specific use case
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, index) => {
    if (line.startsWith('### ')) {
      return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-cyan-300">{line.substring(4)}</h3>;
    }
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-xl font-bold mt-5 mb-2 text-cyan-400 border-b border-slate-600 pb-1">{line.substring(3)}</h2>;
    }
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-2xl font-bold mt-6 mb-3 text-cyan-400">{line.substring(2)}</h1>;
    }
    if (line.match(/^\s*[\d]+\.\s/)) { // Numbered list
      return <p key={index} className="ml-6 my-1 relative before:content-[attr(data-number)] before:absolute before:-left-6 before:font-bold before:text-slate-400" data-number={line.match(/^\s*([\d]+)\./)?.[1] + '.'}>{line.replace(/^\s*[\d]+\.\s/, '')}</p>;
    }
    if (line.startsWith('* ')) { // Bullet list
       return <li key={index} className="ml-6 my-1">{line.substring(2)}</li>;
    }
    if (line.trim() === '---') {
      return <hr key={index} className="my-4 border-slate-600" />;
    }
    if (line.trim() === '') {
      return <br key={index} />;
    }
    return <p key={index} className="my-2 leading-relaxed">{line}</p>;
  });
};


const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ text }) => {
  return (
    <div className="mt-6 bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-lg">
      <div className="prose prose-invert prose-p:text-slate-300 prose-headings:text-cyan-400 max-w-none">
        {renderMarkdown(text)}
      </div>
    </div>
  );
};

export default ResponseDisplay;
