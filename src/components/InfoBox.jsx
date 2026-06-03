import React from 'react';
import { Info } from 'lucide-react';

const InfoBox = ({ children, title = "Note" }) => (
  <div className="my-4 border-l-4 border-accent bg-muted p-4 rounded-r-lg shadow-md flex gap-3">
    <Info className="text-accent-text flex-shrink-0 mt-1" size={20} />
    <div>
      <h4 className="font-bold text-accent-text mb-1">{title}</h4>
      <div className="text-text-muted text-sm leading-relaxed">{children}</div>
    </div>
  </div>
);

export default InfoBox;
