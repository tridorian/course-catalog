import React from 'react';
import { VideoEmbed, SlideDeckEmbed } from './Embeds';
import ContentRenderer from './ContentRenderer';

const PresentationModule = ({ module }) => {
  if (!module) return null;

  // Find the primary embed (first video or slides block)
  const embedBlock = module.blocks?.find(block => block.type === 'video' || block.type === 'slides');

  // Other blocks will be treated as notes/transcript
  const otherBlocks = module.blocks?.filter(block => block !== embedBlock) || [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {embedBlock && (
        <div className="mb-8">
          {embedBlock.type === 'video' ? (
            <VideoEmbed url={embedBlock.url} title={embedBlock.title} />
          ) : (
            <SlideDeckEmbed url={embedBlock.url} title={embedBlock.title} />
          )}
        </div>
      )}

      {otherBlocks.length > 0 && (
        <div className="bg-[#0a120c] rounded-xl border border-[#1f3d25] p-8 shadow-inner">
          <h3 className="text-xs font-mono text-[#4ade80] tracking-widest uppercase mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse"></span>
            Presentation Notes & Transcript
          </h3>
          <ContentRenderer blocks={otherBlocks} />
        </div>
      )}
    </div>
  );
};

export default PresentationModule;
