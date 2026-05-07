import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import ContentRenderer from './ContentRenderer';

const ResourceModule = ({ module }) => {
  if (!module) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {module.resources?.map((res, index) => (
          <a
            key={index}
            href={res.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-[#0a120c] p-6 rounded-xl border border-[#1f3d25] hover:border-[#4ade80] transition-all hover:shadow-[0_0_20px_rgba(74,222,128,0.1)]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#132617] rounded-lg text-[#4ade80]">
                <FileText size={24} />
              </div>
              <ExternalLink size={18} className="text-gray-600 group-hover:text-[#4ade80] transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#4ade80] transition-colors">{res.title}</h3>
            <p className="text-[#86efac] text-sm leading-relaxed">{res.description}</p>
            {res.type && (
              <div className="mt-4 pt-4 border-t border-[#1f3d25] flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#132617] text-[#4ade80] rounded">
                  {res.type}
                </span>
              </div>
            )}
          </a>
        ))}
      </div>

      {/* Fallback to blocks if no explicit resources array */}
      {(!module.resources || module.resources.length === 0) && (
        <div className="bg-[#0a120c] rounded-xl border border-[#1f3d25] p-8">
           <ContentRenderer blocks={module.blocks} />
        </div>
      )}
    </div>
  );
};

export default ResourceModule;
