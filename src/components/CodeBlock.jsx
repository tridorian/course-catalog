import React from 'react';
import { Terminal } from 'lucide-react';

const CodeBlock = ({ language = "bash", code }) => (
  <div className="my-4 rounded-lg overflow-hidden border border-[#1f3d25] bg-[#0a120c] shadow-lg">
    <div className="bg-[#132617] px-4 py-2 text-xs font-semibold text-[#86efac] flex justify-between items-center border-b border-[#1f3d25]">
      <span>{language.toUpperCase()}</span>
      <Terminal size={14} />
    </div>
    <pre className="p-4 overflow-x-auto text-sm text-[#f0fdf4] font-mono leading-relaxed">
      <code>{code}</code>
    </pre>
  </div>
);

export default CodeBlock;
