import React from 'react';
import * as Icons from 'lucide-react';
import CodeBlock from './CodeBlock';
import InfoBox from './InfoBox';
import WarningBox from './WarningBox';
import { VideoEmbed, SlideDeckEmbed } from './Embeds';
import InteractiveQuiz from './InteractiveQuiz';

const ContentRenderer = ({ blocks, sourceFile, onQuizPassed }) => {
  if (!blocks) return null;

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h1':
            return <h1 key={index} className="text-4xl font-extrabold text-main mb-8 mt-4 leading-tight">{block.content}</h1>;

          case 'h2':
            return <h2 key={index} className="text-2xl font-bold text-main mt-12 mb-6 border-b border-border-main pb-3 leading-snug">{block.content}</h2>;

          case 'h3':
            return <h3 key={index} className="text-xl font-bold text-accent-text mt-8 mb-4 leading-normal">{block.content}</h3>;

          case 'p':
            return (
              <p key={index} className={`text-base md:text-lg text-text-muted leading-relaxed mb-6 ${block.italic ? 'italic' : ''}`}>
                {renderMarkdown(block.content)}
              </p>
            );

          case 'video':
            return <VideoEmbed key={index} url={block.url} title={block.title} sourceFile={sourceFile} />;

          case 'slides':
            return <SlideDeckEmbed key={index} url={block.url} title={block.title} sourceFile={sourceFile} />;

          case 'grid':
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mb-8">
                {block.items.map((item, i) => {
                  const Icon = Icons[item.icon] || Icons.HelpCircle;
                  return (
                    <div
                      key={i}
                      className={`bg-muted p-6 rounded-xl border border-border-main ${item.border ? 'border-t-4' : ''}`}
                      style={item.border ? { borderTopColor: item.border } : {}}
                    >
                      <Icon className="text-accent-text w-10 h-10 mb-4" />
                      <h3 className="text-xl font-bold text-main mb-2">{item.title}</h3>
                      <p className="text-text-muted text-sm leading-relaxed">{item.content}</p>
                    </div>
                  );
                })}
              </div>
            );

          case 'list':
            return (
              <ul key={index} className="space-y-3 text-text-muted">
                {block.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Icons.CheckCircle2 className="text-accent-text" size={18}/>
                    <span>{renderMarkdown(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'numbered_list':
            return (
              <div key={index} className="space-y-10 mt-10 mb-10 border-l border-border-main pl-6 md:pl-8 ml-3 md:ml-4">
                {block.items.map((item, i) => (
                  <div key={i} className="relative pb-2">
                    {/* Step Node */}
                    <div className="absolute -left-[39px] md:-left-[49px] top-0 w-7 h-7 md:w-9 md:h-9 rounded-full bg-accent text-accent-fg flex items-center justify-center text-xs md:text-sm font-extrabold shadow-accent border-2 border-base">
                      {i + 1}
                    </div>
                    <div className="space-y-4">
                      {typeof item === 'string' ? (
                        <div className="text-base md:text-lg text-text-muted leading-relaxed pt-0.5">{renderMarkdown(item)}</div>
                      ) : (
                        <>
                          <h4 className="text-lg font-bold text-main leading-tight pt-0.5">{renderMarkdown(item.title)}</h4>
                          {item.content && (
                            <p className="text-base text-text-muted leading-relaxed">{renderMarkdown(item.content)}</p>
                          )}
                          {item.code && <CodeBlock code={item.code} />}
                          {item.prompt && (
                             <div className="bg-[#050805]/40 p-4 rounded-xl text-text-muted font-mono text-sm border border-border-main mt-2 mb-2 italic">
                              Prompt: "{item.prompt}"
                             </div>
                          )}
                          {item.sub_blocks && <ContentRenderer blocks={item.sub_blocks} onQuizPassed={onQuizPassed} sourceFile={sourceFile} />}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );

          case 'tier_card':
            return (
              <div key={index} className={`p-5 border rounded-xl relative overflow-hidden my-6 ${block.recommended ? 'border-accent bg-muted' : 'border-border-main bg-panel'}`}>
                {block.recommended && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-fg text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                )}
                <h4 className="font-bold text-main mb-2">{block.title}</h4>
                <p className="text-sm text-text-muted mb-4">{block.description}</p>
                {block.code && <CodeBlock code={block.code} />}
                {block.items && (
                  <ul className="list-disc pl-5 text-sm text-text-muted space-y-1">
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
              <div key={index} className="bg-panel p-6 rounded-xl border border-border-main my-6 shadow-sm-themed">
                <h3 className="text-xl font-bold text-accent-text flex items-center gap-2 mb-3">
                  <FeatureIcon size={24}/> {block.title}
                </h3>
                <p className="text-text-muted mb-4 leading-relaxed">{renderMarkdown(block.content)}</p>
                {block.prompt && (
                  <div className="bg-[#050805]/40 p-3 rounded-lg text-text-muted font-mono text-sm border-l-2 border-accent">
                    Prompt: "{block.prompt}"
                  </div>
                )}
                {block.footer && <p className="text-sm text-text-muted mt-2 opacity-80">{block.footer}</p>}
              </div>
            );

          case 'timeline':
            return (
              <div key={index} className="space-y-8 mt-10 mb-10">
                {block.items.map((item, i) => (
                  <div key={i} className={`border-l-2 border-border-main pl-6 pb-6 relative ${i === block.items.length - 1 ? 'border-transparent' : ''}`}>
                    <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-1 ${i === 0 ? 'bg-accent shadow-accent' : 'bg-elevated border-2 border-accent'}`}></div>
                    <h3 className="text-xl font-bold text-main mb-2">{item.title}</h3>
                    <p className="text-text-muted mb-3 leading-relaxed">{renderMarkdown(item.content)}</p>
                    {item.code && <CodeBlock code={item.code} />}
                    {item.prompt && (
                      <div className="bg-[#050805]/40 p-3 rounded-lg text-text-muted font-mono text-sm italic border border-border-main">
                        "{item.prompt}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );

          case 'recovery_options':
             return (
               <ul key={index} className="space-y-4 text-text-muted my-6">
                 {block.items.map((item, i) => (
                   <li key={i} className={`p-5 rounded-xl border ${item.highlight ? 'border-accent bg-muted relative overflow-hidden' : 'border-border-main bg-muted'}`}>
                     {item.highlight && (
                        <div className="absolute top-0 right-0 bg-accent text-accent-fg text-[10px] font-bold px-2 py-1 rounded-bl">INSTANT RECOVERY</div>
                     )}
                     <strong className="text-main block mb-1.5">{item.title}:</strong>
                     <span className="leading-relaxed">{item.content}</span>
                   </li>
                 ))}
               </ul>
             );

          case 'congrats':
            return (
              <div key={index} className="space-y-6 text-center py-16">
                <Icons.CheckCircle2 className="text-accent-text w-24 h-24 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                <h1 className="text-5xl font-extrabold text-main mb-4">Congratulations!</h1>
                <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
                  {block.content}
                </p>
              </div>
            );

          case 'next_steps':
            return (
              <div key={index} className="max-w-2xl mx-auto mt-16 bg-muted p-8 rounded-2xl border border-border-main text-left shadow-sm-themed">
                <h3 className="text-2xl font-bold text-main mb-4">{block.title}</h3>
                <ul className="space-y-4 text-text-muted">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Icons.ChevronRight className="text-accent-text mt-1 flex-shrink-0" size={20}/>
                      <div className="leading-relaxed">
                        <strong className="text-main">{item.title}:</strong> {item.content}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );

          case 'interactive_quiz':
            return <InteractiveQuiz key={index} questions={block.questions} onPassed={onQuizPassed} />;

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
      return <strong key={i} className="text-main font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-muted px-1 rounded text-text-muted">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('[') && part.endsWith(')')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return <a key={i} href={match[2]} target="_blank" rel="noreferrer" className="text-accent-text hover:underline underline-offset-2">{match[1]}</a>;
      }
    }
    return part;
  });
}

export default ContentRenderer;
