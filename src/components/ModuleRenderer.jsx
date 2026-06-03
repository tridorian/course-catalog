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
            <div className="mt-8 bg-muted p-6 rounded-xl border border-border-main">
              <h3 className="text-xl font-bold text-accent-text mb-4">Notes & Transcript</h3>
              <div className="text-text-muted space-y-4">
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

          <div className="bg-panel p-8 rounded-xl border border-border-main flex flex-col items-center text-center max-w-2xl mx-auto mt-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 border border-border-main">
              <FileText className="text-accent-text" size={32} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">Reference Material</h2>

            {module.description && (
              <p className="text-text-muted mb-8">{module.description}</p>
            )}

            {module.url && (
              <a
                href={module.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-fg font-bold rounded-lg hover:brightness-110 transition-colors shadow-accent"
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
