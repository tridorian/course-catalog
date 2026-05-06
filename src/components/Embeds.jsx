import React from 'react';

export const VideoEmbed = ({ url, title }) => {
  // Convert Drive share URL to embed URL
  const embedUrl = url.replace('/view', '/preview').replace('/edit', '/preview');

  return (
    <div className="my-6 aspect-video w-full rounded-xl overflow-hidden border border-[#1f3d25] bg-black shadow-2xl">
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full"
        allow="autoplay"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export const SlideDeckEmbed = ({ url, title }) => {
  // Convert Slides share URL to embed URL
  const embedUrl = url.replace('/edit', '/embed');

  return (
    <div className="my-8 aspect-[16/9] w-full rounded-xl overflow-hidden border border-[#1f3d25] bg-[#0a120c] shadow-2xl">
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full"
        allowFullScreen
      ></iframe>
    </div>
  );
};
