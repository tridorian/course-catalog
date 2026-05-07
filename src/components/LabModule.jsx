import React from 'react';
import ContentRenderer from './ContentRenderer';

const LabModule = ({ module }) => {
  if (!module || !module.blocks) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ContentRenderer blocks={module.blocks} />
    </div>
  );
};

export default LabModule;
