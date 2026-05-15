import React from 'react';
import ContentRenderer from './ContentRenderer';
import { SlideDeckEmbed, VideoEmbed } from './Embeds';
import { FileText, ExternalLink } from 'lucide-react';

const ModuleRenderer = ({ module, sourceFile }) => {
  if (!module) return null;

  switch (module.type) {
    case 'presentation':
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white mb-6">{module.title}</h1>
          {module.url && module.url.includes('docs.google.com/presentation') ? (
            <SlideDeckEmbed url={module.url} title={module.title} sourceFile={sourceFile} />
          ) : module.url ? (
            <VideoEmbed url={module.url} title={module.title} sourceFile={sourceFile} />
          ) : null}
          {module.notes && (
            <div className="mt-8 bg-[#132617] p-6 rounded-xl border border-[#1f3d25]">
              <h3 className="text-xl font-bold text-[#4ade80] mb-4">Notes & Transcript</h3>
              <div className="text-[#bbf7d0] space-y-4">
                {module.notes}
              </div>
            </div>
          )}
        </div>
      );

    case 'resource':
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white mb-6">{module.title}</h1>

          <div className="bg-[#0a120c] p-8 rounded-xl border border-[#1f3d25] flex flex-col items-center text-center max-w-2xl mx-auto mt-12">
            <div className="w-16 h-16 bg-[#132617] rounded-full flex items-center justify-center mb-6 border border-[#1f3d25]">
              <FileText className="text-[#4ade80]" size={32} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">Reference Material</h2>

            {module.description && (
              <p className="text-[#bbf7d0] mb-8">{module.description}</p>
            )}

            {module.url && (
              <a
                href={module.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-[#4ade80] text-black font-bold rounded-lg hover:bg-[#22c55e] transition-colors shadow-[0_0_15px_rgba(74,222,128,0.3)]"
              >
                Open Resource <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>
      );

    case 'lab':
    default:
      return <ContentRenderer blocks={module.blocks} sourceFile={sourceFile} />;
  }
};

export default ModuleRenderer;
