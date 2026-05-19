import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface ReportFormProps {
  onGenerate: (name: string, format: string, params: any) => void;
  loading: boolean;
}

const ReportForm: React.FC<ReportFormProps> = ({ onGenerate, loading }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [format, setFormat] = useState("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [segment, setSegment] = useState("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onGenerate(name, format, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, userSegment: segment });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('admin.reportForm.reportName')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('admin.reportForm.reportNamePlaceholder')} required />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('admin.reportForm.format')}</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="csv">{t('admin.reportForm.csv')}</option>
            <option value="pdf">{t('admin.reportForm.pdf')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('admin.reportForm.dateFrom')}</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('admin.reportForm.dateTo')}</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('admin.reportForm.userSegment')}</label>
        <select value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
          <option value="all">{t('admin.reportForm.allUsers')}</option>
          <option value="user">{t('admin.reportForm.regularUsersOnly')}</option>
          <option value="admin">{t('admin.reportForm.adminsOnly')}</option>
        </select>
      </div>
      <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-xl transition-colors">
        {loading ? t('admin.reportForm.generating') : t('admin.reportForm.generateReport')}
      </button>
    </form>
  );
};

export default ReportForm;
