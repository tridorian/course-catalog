import { ShieldAlert } from 'lucide-react';

const WarningBox = ({ children, title = "Warning" }) => (
  <div className="my-4 border-l-4 border-red-500 bg-red-950/30 p-4 rounded-r-lg shadow-md flex gap-3">
    <ShieldAlert className="text-red-400 flex-shrink-0 mt-1" size={20} />
    <div>
      <h4 className="font-bold text-red-400 mb-1">{title}</h4>
      <div className="text-red-200 text-sm leading-relaxed">{children}</div>
    </div>
  </div>
);

export default WarningBox;
