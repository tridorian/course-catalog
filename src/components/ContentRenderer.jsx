import React from 'react';
import * as Icons from 'lucide-react';
import CodeBlock from './CodeBlock';
import InfoBox from './InfoBox';
import WarningBox from './WarningBox';
import { VideoEmbed, SlideDeckEmbed } from './Embeds';

const ContentRenderer = ({ blocks, sourceFile }) => {
  if (!blocks) return null;

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h1':
            return <h1 key={index} className="text-4xl font-extrabold text-white mb-6">{block.content}</h1>;

          case 'h2':
            return <h2 key={index} className="text-2xl font-bold text-white mt-8 mb-4 border-b border-[#1f3d25] pb-2">{block.content}</h2>;

          case 'h3':
            return <h3 key={index} className="text-xl font-bold text-[#4ade80] mt-8 mb-2">{block.content}</h3>;

          case 'p':
            return (
              <p key={index} className={`text-lg text-[#bbf7d0] ${block.italic ? 'italic' : ''}`}>
                {renderMarkdown(block.content)}
              </p>
            );

          case 'video':
            return <VideoEmbed key={index} url={block.url} title={block.title} sourceFile={sourceFile} />;

          case 'slides':
            return <SlideDeckEmbed key={index} url={block.url} title={block.title} sourceFile={sourceFile} />;

          case 'grid':
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {block.items.map((item, i) => {
                  const Icon = Icons[item.icon] || Icons.HelpCircle;
                  return (
                    <div
                      key={i}
                      className={`bg-[#132617] p-6 rounded-xl border border-[#1f3d25] ${item.border ? 'border-t-4' : ''}`}
                      style={item.border ? { borderTopColor: item.border } : {}}
                    >
                      <Icon className="text-[#4ade80] w-10 h-10 mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-[#86efac] text-sm">{item.content}</p>
                    </div>
                  );
                })}
              </div>
            );

          case 'list':
            return (
              <ul key={index} className="space-y-3 text-[#bbf7d0]">
                {block.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Icons.CheckCircle2 className="text-[#4ade80]" size={18}/>
                    <span>{renderMarkdown(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'numbered_list':
            return (
              <ol key={index} className="list-decimal pl-5 space-y-6 text-[#bbf7d0] mt-6">
                {block.items.map((item, i) => (
                  <li key={i}>
                    {typeof item === 'string' ? (
                      renderMarkdown(item)
                    ) : (
                      <>
                        <strong className="text-white">{renderMarkdown(item.title)}</strong> {renderMarkdown(item.content)}
                        {item.code && <CodeBlock code={item.code} />}
                        {item.prompt && (
                           <div className="bg-black/50 p-4 rounded-lg text-[#86efac] font-mono text-sm border border-[#1f3d25] mt-2 mb-2 italic">
                            Prompt: "{item.prompt}"
                          </div>
                        )}
                        {item.sub_blocks && <ContentRenderer blocks={item.sub_blocks} />}
                      </>
                    )}
                  </li>
                ))}
              </ol>
            );

          case 'tier_card':
            return (
              <div key={index} className={`p-4 border rounded-lg relative overflow-hidden ${block.recommended ? 'border-[#4ade80] bg-[#132617]' : 'border-[#1f3d25] bg-[#0a120c]'}`}>
                {block.recommended && (
                  <div className="absolute top-0 right-0 bg-[#4ade80] text-black text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                )}
                <h4 className="font-bold text-white mb-2">{block.title}</h4>
                <p className="text-sm text-[#86efac] mb-3">{block.description}</p>
                {block.code && <CodeBlock code={block.code} />}
                {block.items && (
                  <ul className="list-disc pl-5 text-sm text-[#bbf7d0] space-y-1">
                    {block.items.map((li, i) => <li key={i}>{renderMarkdown(li)}</li>)}
                  </ul>
                )}
              </div>
            );

          case 'info':
            return (
              <InfoBox key={index} title={block.title}>
                {block.content}
                {block.code && <CodeBlock code={block.code} />}
              </InfoBox>
            );

          case 'warning':
            return <WarningBox key={index} title={block.title}>{block.content}</WarningBox>;

          case 'code':
            return <CodeBlock key={index} language={block.language} code={block.code || block.content} />;

          case 'feature_card':
            const FeatureIcon = Icons[block.icon] || Icons.Code2;
            return (
              <div key={index} className="bg-[#0a120c] p-6 rounded-xl border border-[#1f3d25]">
                <h3 className="text-xl font-bold text-[#4ade80] flex items-center gap-2 mb-3">
                  <FeatureIcon size={24}/> {block.title}
                </h3>
                <p className="text-[#bbf7d0] mb-4">{renderMarkdown(block.content)}</p>
                {block.prompt && (
                  <div className="bg-black/50 p-3 rounded text-[#86efac] font-mono text-sm border-l-2 border-[#4ade80]">
                    Prompt: "{block.prompt}"
                  </div>
                )}
                {block.footer && <p className="text-sm text-gray-400 mt-2">{block.footer}</p>}
              </div>
            );

          case 'timeline':
            return (
              <div key={index} className="space-y-6 mt-8">
                {block.items.map((item, i) => (
                  <div key={i} className={`border-l-2 border-[#1f3d25] pl-6 pb-6 relative ${i === block.items.length - 1 ? 'border-transparent' : ''}`}>
                    <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-1 ${i === 0 ? 'bg-[#4ade80] shadow-[0_0_10px_#4ade80]' : 'bg-[#1f3d25] border-2 border-[#4ade80]'}`}></div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-[#bbf7d0] mb-2">{renderMarkdown(item.content)}</p>
                    {item.code && <CodeBlock code={item.code} />}
                    {item.prompt && (
                      <div className="bg-black/50 p-3 rounded text-[#86efac] font-mono text-sm italic border border-[#1f3d25]">
                        "{item.prompt}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );

          case 'recovery_options':
             return (
               <ul key={index} className="space-y-4 text-[#bbf7d0]">
                 {block.items.map((item, i) => (
                   <li key={i} className={`p-4 rounded border ${item.highlight ? 'border-[#4ade80] bg-[#132617] relative overflow-hidden' : 'border-[#1f3d25] bg-[#132617]'}`}>
                     {item.highlight && (
                        <div className="absolute top-0 right-0 bg-[#4ade80] text-black text-[10px] font-bold px-2 py-1 rounded-bl">INSTANT RECOVERY</div>
                     )}
                     <strong className="text-white block mb-1">{item.title}:</strong>
                     {item.content}
                   </li>
                 ))}
               </ul>
             );

          case 'congrats':
            return (
              <div key={index} className="space-y-6 text-center py-12">
                <Icons.CheckCircle2 className="text-[#4ade80] w-24 h-24 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                <h1 className="text-5xl font-extrabold text-white mb-4">Congratulations!</h1>
                <p className="text-xl text-[#bbf7d0] max-w-2xl mx-auto leading-relaxed">
                  {block.content}
                </p>
              </div>
            );

          case 'next_steps':
            return (
              <div key={index} className="max-w-2xl mx-auto mt-12 bg-[#132617] p-8 rounded-2xl border border-[#1f3d25] text-left">
                <h3 className="text-2xl font-bold text-white mb-4">{block.title}</h3>
                <ul className="space-y-4 text-[#bbf7d0]">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Icons.ChevronRight className="text-[#4ade80] mt-1 flex-shrink-0" size={20}/>
                      <div>
                        <strong className="text-white">{item.title}:</strong> {item.content}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

// Simple helper to handle basic bolding and code ticks in strings
function renderMarkdown(text) {
  if (typeof text !== 'string') return text;

  // Split by bold, code, or links
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-[#132617] px-1 rounded text-[#86efac]">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('[') && part.endsWith(')')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const text = match[1];
        let href = match[2];

        // URL Sanitization to prevent XSS
        let isSafe = false;
        try {
          // Parse the URL. We use a dummy base for relative URLs.
          const parsedUrl = new URL(href, 'http://dummy.com');
          // Allow specific safe protocols
          const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
          if (safeProtocols.includes(parsedUrl.protocol)) {
            isSafe = true;
          }
        } catch (e) {
          // If URL parsing fails, it might be an invalid URL. We err on the side of caution.
          isSafe = false;
        }

        if (isSafe) {
          return <a key={i} href={href} target="_blank" rel="noreferrer" className="text-[#4ade80] hover:underline underline-offset-2">{text}</a>;
        } else {
          // If the link is not safe, render it as plain text (or bold text as it's meant to stand out)
          return <span key={i} className="text-[#4ade80]" title="Blocked insecure link">{text}</span>;
        }
      }
    }
    return part;
  });
}

export default ContentRenderer;
