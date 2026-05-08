import React from 'react';
import { PlayCircle, Presentation } from 'lucide-react';

export const VideoEmbed = ({ url, title = "Video Walkthrough" }) => {
  // Convert Google Drive share link to embed link
  // Share link: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // Embed link: https://drive.google.com/file/d/FILE_ID/preview
  let embedUrl = url;
  if (url.includes('drive.google.com')) {
    embedUrl = url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
  }

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-[#1f3d25] bg-[#0a120c] shadow-2xl group">
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

export const SlideDeckEmbed = ({ url, title = "Reference Slide Deck" }) => {
  // Convert Google Slides share link to the standard embed link
  // Share link: https://docs.google.com/presentation/d/FILE_ID/edit?usp=sharing
  // Standard Embed: https://docs.google.com/presentation/d/FILE_ID/embed?start=false
  let embedUrl = url;
  if (url.includes('docs.google.com/presentation')) {
    // 1. Strip off /edit, /view, or /pub and anything that comes after it
    let baseUrl = url.replace(/\/(edit|view|pub).*$/, '');
    
    // 2. Append /embed. Removing rm=minimal brings back the bottom navigation 
    // bar while still hiding the top menu (File, Edit, Sign In)
    embedUrl = `${baseUrl}/embed?start=false&loop=false&delayms=3000`;
  }

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-[#1f3d25] bg-[#0a120c] shadow-2xl">
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
