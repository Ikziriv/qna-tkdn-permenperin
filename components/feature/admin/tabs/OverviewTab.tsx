import React from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { useAdminData } from "@/contexts/AdminDataContext";
import { StatCard } from "@/components/feature/admin/StatCard";
import { ChartCard } from "@/components/feature/admin/ChartCard";
import { COLORS } from "@/components/feature/admin/types";

const OverviewTab: React.FC = () => {
  const { t } = useTranslation();
  const { stats, dailyActivity, leaderboard, completionRate, scoreDistribution, roleDistribution } = useAdminData();

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" label={t('admin.stats.totalUsers')} value={stats.totalUsers} accent="blue" trend={{ value: "12%", positive: true }} />
        <StatCard icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" label={t('admin.stats.activeUsers')} value={stats.activeUsers} accent="emerald" trend={{ value: "5%", positive: true }} />
        <StatCard icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" label={t('admin.stats.attempts')} value={stats.totalAttempts} accent="indigo" trend={{ value: "8%", positive: true }} />
        <StatCard icon="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" label={t('admin.stats.avgScore')} value={stats.averageScore ? `${stats.averageScore}%` : "N/A"} accent="amber" />
        <StatCard icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" label={t('admin.stats.completion')} value={`${completionRate}%`} accent="rose" trend={{ value: "3%", positive: false }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title={t('admin.charts.dailyActivity')}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyActivity}>
              <defs><linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <ReTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
              <Area type="monotone" dataKey="attempts" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAttempts)" dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('admin.charts.scoreDistribution')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={scoreDistribution} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <ReTooltip cursor={{ fill: "#f8fafc", radius: 8 }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
              <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('admin.charts.roleDistribution')}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} stroke="none" paddingAngle={4}>
                {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
              <ReTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('admin.charts.topPerformers')}>
          <div className="space-y-3 pt-2">
            {leaderboard.slice(0, 5).map((entry, idx) => (
              <div key={entry.userId} className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-100 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-black ${
                    idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-slate-200 text-slate-700" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-400"
                  }`}>{idx + 1}</span>
                  <span className="text-sm font-bold text-slate-800">{entry.userName || t('admin.anonymous')}</span>
                  <span className="text-xs text-slate-400 ml-2">{entry.totalAttempts} {t('admin.attemptsCount')}</span>
                </div>
                <span className="text-lg font-black text-blue-600">{entry.bestScore}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default OverviewTab;
