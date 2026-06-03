import React from 'react';
import { Terminal } from 'lucide-react';

const CodeBlock = ({ language = "bash", code }) => (
  <div className="my-4 rounded-lg overflow-hidden border border-border-main bg-panel shadow-lg">
    <div className="bg-muted px-4 py-2 text-xs font-semibold text-text-muted flex justify-between items-center border-b border-border-main">
      <span>{language.toUpperCase()}</span>
      <Terminal size={14} />
    </div>
    <pre className="p-4 overflow-x-auto text-sm text-main font-mono leading-relaxed">
      <code>{code}</code>
    </pre>
  </div>
);

export default CodeBlock;
