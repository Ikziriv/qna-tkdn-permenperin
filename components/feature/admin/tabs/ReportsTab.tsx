import React from "react";
import { useTranslation } from "react-i18next";
import { useAdminData } from "@/contexts/AdminDataContext";
import { ReportForm } from "@/components/feature/admin/ReportForm";
import { api } from "@/lib/api";

const ReportsTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.language as "en" | "id";
  const {
    reportsList, reportFormOpen, setReportFormOpen, generatingReport,
    handleGenerateReport, handleDownloadReport, isSuperAdmin
  } = useAdminData();

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{t('admin.reportGenerator')}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.exportSystemData')}</p>
          </div>
          <button onClick={() => setReportFormOpen(!reportFormOpen)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportFormOpen ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-600"}`}>
            {reportFormOpen ? t('admin.cancel') : t('admin.createNew')}
            <svg className={`w-4 h-4 transition-transform duration-300 ${reportFormOpen ? "rotate-45" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
        {reportFormOpen && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <ReportForm onGenerate={handleGenerateReport} loading={generatingReport} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('admin.generatedArchive')}</h3>
        </div>
        {reportsList.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <p className="text-sm font-bold text-slate-400">{t('admin.noReports')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.name')}</th>
                  <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.format')}</th>
                  <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.status')}</th>
                  <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.generated')}</th>
                  <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reportsList.map((r) => (
                  <tr key={r.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-black text-slate-800">{r.name}</td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border-2 border-slate-200/50">{r.format.toUpperCase()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 ${
                        r.status === "ready" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        r.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>{t('admin.reportStatus.' + r.status)}</span>
                    </td>
                    <td className="px-8 py-6 text-slate-400 font-medium text-xs">{new Date(r.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {r.status === "ready" && (
                          <button onClick={() => handleDownloadReport(r)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95">{t('admin.download')}</button>
                        )}
                        {isSuperAdmin && (
                          <button onClick={() => api.admin.getReportAccessLogs(r.id).then((res) => alert(`${t('admin.downloads')}: ${res.logs?.length || 0}`))} className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all" title={t('admin.accessLogs')}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.708 0 3.305.429 4.704 1.185M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;
