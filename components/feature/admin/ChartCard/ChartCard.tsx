import React from "react";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600/20"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600/40"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600/60"></div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default ChartCard;
