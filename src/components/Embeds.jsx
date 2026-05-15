import React, { useState } from 'react';
import { PlayCircle, Presentation, Pencil, Copy, Check, X } from 'lucide-react';

const isDev = import.meta.env.DEV;

/**
 * Dev-mode overlay for editing embed URLs inline.
 * Shows the source file path and current URL for quick reference.
 */
const EmbedEditOverlay = ({ url, sourceFile, onClose }) => {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="absolute inset-0 bg-black/90 z-20 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#0a120c] border border-[#4ade80] rounded-xl p-6 max-w-lg w-full shadow-[0_0_30px_rgba(74,222,128,0.2)]">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-bold text-[#4ade80] tracking-wider uppercase">Edit Embed URL</h4>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Source File</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#132617] px-3 py-2 rounded text-xs text-[#86efac] font-mono break-all">
                {sourceFile || 'Unknown'}
              </code>
              <button
                onClick={() => copyToClipboard(sourceFile || '', 'file')}
                className="p-2 hover:bg-[#132617] rounded transition-colors text-gray-400 hover:text-[#4ade80]"
                title="Copy file path"
              >
                {copied === 'file' ? <Check size={14} className="text-[#4ade80]" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Current URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#132617] px-3 py-2 rounded text-xs text-[#86efac] font-mono break-all">
                {url}
              </code>
              <button
                onClick={() => copyToClipboard(url, 'url')}
                className="p-2 hover:bg-[#132617] rounded transition-colors text-gray-400 hover:text-[#4ade80]"
                title="Copy URL"
              >
                {copied === 'url' ? <Check size={14} className="text-[#4ade80]" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
            Open the source file above and update the <code className="text-[#86efac]">"url"</code> field.
            The dev server will hot-reload on next navigation.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Dev-mode edit button that appears on hover over embeds.
 */
const DevEditButton = ({ onClick }) => {
  if (!isDev) return null;
  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 z-10 p-1.5 bg-[#132617] border border-[#1f3d25] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-[#4ade80] hover:text-black text-[#4ade80]"
      title="Edit embed URL (dev mode)"
    >
      <Pencil size={12} />
    </button>
  );
};

export const VideoEmbed = ({ url, title = "Video Walkthrough", sourceFile }) => {
  const [showEdit, setShowEdit] = useState(false);

  // Convert Google Drive share link to embed link
  let embedUrl = url;
  if (url.includes('drive.google.com')) {
    embedUrl = url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
  }

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-[#1f3d25] bg-[#0a120c] shadow-2xl group relative">
      <DevEditButton onClick={() => setShowEdit(true)} />
      {showEdit && <EmbedEditOverlay url={url} sourceFile={sourceFile} onClose={() => setShowEdit(false)} />}
      <div className="bg-[#132617] px-4 py-2 text-xs font-semibold text-[#4ade80] flex justify-between items-center border-b border-[#1f3d25]">
        <span className="flex items-center gap-2">
          <PlayCircle size={14} />
          {title.toUpperCase()}
        </span>
        <span className="text-[10px] opacity-50 font-mono tracking-tighter">MP4 // DRIVE_STREAM</span>
      </div>
      <div className="aspect-video w-full bg-black">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay"
          title={title}
        ></iframe>
      </div>
    </div>
  );
};

export const SlideDeckEmbed = ({ url, title = "Reference Slide Deck", sourceFile }) => {
  const [showEdit, setShowEdit] = useState(false);

  // Convert Google Slides share link to the standard embed link
  let embedUrl = url;
  if (url.includes('docs.google.com/presentation')) {
    let baseUrl = url.replace(/\/(edit|view|pub).*$/, '');
    embedUrl = `${baseUrl}/embed?start=false&loop=false&delayms=3000`;
  }

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-[#1f3d25] bg-[#0a120c] shadow-2xl group relative">
      <DevEditButton onClick={() => setShowEdit(true)} />
      {showEdit && <EmbedEditOverlay url={url} sourceFile={sourceFile} onClose={() => setShowEdit(false)} />}
      <div className="bg-[#132617] px-4 py-2 text-xs font-semibold text-[#86efac] flex justify-between items-center border-b border-[#1f3d25]">
        <span className="flex items-center gap-2">
          <Presentation size={14} />
          {title.toUpperCase()}
        </span>
        <span className="text-[10px] opacity-50 font-mono tracking-tighter">GSLIDES // VIEW_MODE</span>
      </div>
      <div className="aspect-[16/9] w-full bg-black">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen={true}
          title={title}
        ></iframe>
      </div>
    </div>
  );
};
