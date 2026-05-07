import React from 'react';
import LabModule from './LabModule';
import PresentationModule from './PresentationModule';
import ResourceModule from './ResourceModule';

const ModuleRenderer = ({ module }) => {
  if (!module) return null;

  switch (module.type) {
    case 'presentation':
      return <PresentationModule module={module} />;
    case 'resource':
      return <ResourceModule module={module} />;
    case 'lab':
    default:
      return <LabModule module={module} />;
  }
};

export default ModuleRenderer;
