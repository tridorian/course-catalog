import React from 'react';
import { Info } from 'lucide-react';

const InfoBox = ({ children, title = "Note" }) => (
  <div className="my-4 border-l-4 border-[#4ade80] bg-[#132617] p-4 rounded-r-lg shadow-md flex gap-3">
    <Info className="text-[#4ade80] flex-shrink-0 mt-1" size={20} />
    <div>
      <h4 className="font-bold text-[#4ade80] mb-1">{title}</h4>
      <div className="text-[#bbf7d0] text-sm leading-relaxed">{children}</div>
    </div>
  </div>
);

export default InfoBox;
