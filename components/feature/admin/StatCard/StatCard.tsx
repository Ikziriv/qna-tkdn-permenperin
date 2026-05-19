import React from "react";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  accent: string;
  trend?: { value: string; positive: boolean };
}

const gradients: Record<string, string> = {
  blue: "from-blue-600 to-indigo-600 shadow-blue-200",
  emerald: "from-emerald-500 to-teal-600 shadow-emerald-200",
  indigo: "from-indigo-600 to-violet-600 shadow-indigo-200",
  amber: "from-amber-500 to-orange-600 shadow-amber-200",
  rose: "from-rose-500 to-pink-600 shadow-rose-200",
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, accent, trend }) => {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[accent]} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
        </div>
        {trend && (
          <div className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 ${trend.positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </div>
        )}
      </div>
      <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.15em] mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
};

export default StatCard;
