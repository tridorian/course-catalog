import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

const highlightCode = (code, lang) => {
  if (!code) return '';
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  if (lang === 'bash' || lang === 'shell' || lang === 'sh') {
    return escaped
      // Comments
      .replace(/(^|[^:])(#.*)$/gm, '$1<span class="text-zinc-500 font-normal">$2</span>')
      // Command prefixes/executables
      .replace(/\b(npm|npx|node|git|cd|mkdir|rm|cp|mv|sudo|apt|curl|wget|docker|gcloud|jules|python|python3|pip|cat|grep|ls|chmod)\b/g, '<span class="text-sky-400 font-bold">$1</span>')
      // Subcommands/arguments
      .replace(/\b(install|run|start|dev|build|test|commit|push|pull|checkout|clone|status|add|init|deploy|auth|login|new|config|save)\b/g, '<span class="text-emerald-400">$1</span>');
  }
  
  // Generic / JS / JSON
  return escaped
    // Comments
    .replace(/(\/\/.*)$/gm, '<span class="text-zinc-500 font-normal">$1</span>')
    // String literals
    .replace(/(["'`])(.*?)\1/g, '<span class="text-amber-300">$1$2$1</span>')
    // Keywords
    .replace(/\b(const|let|var|function|return|import|export|from|default|class|extends|if|else|for|while|async|await|try|catch|new|throw|typeof)\b/g, '<span class="text-purple-400 font-bold">$1</span>')
    // Constants / Numbers
    .replace(/\b(true|false|null|undefined|\d+)\b/g, '<span class="text-orange-400">$1</span>');
};

const CodeBlock = ({ language = "bash", code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-lg group relative">
      <div className="bg-zinc-900 px-4 py-2.5 text-xs font-mono text-zinc-400 flex justify-between items-center border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-zinc-500" />
          <span className="font-bold tracking-wider">{language.toUpperCase()}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto text-[13px] text-zinc-100 font-mono leading-relaxed custom-scrollbar bg-zinc-950">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
      </pre>
    </div>
  );
};

export default CodeBlock;
