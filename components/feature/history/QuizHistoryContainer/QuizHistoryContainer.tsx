import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";

interface Attempt {
  id: number;
  quizId: number;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  totalQuestions: number | null;
  correctAnswers: number | null;
  timeSpentSeconds: number | null;
}

interface ProgressStats {
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number | null;
  bestScore: number;
  totalQuestions: number;
  totalCorrect: number;
}

interface QuizHistoryProps {
  onBack: () => void;
}

const QuizHistory: React.FC<QuizHistoryProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [progressRes, attemptsRes] = await Promise.all([
        api.quiz.getMyProgress(),
        api.quiz.getMyAttempts(),
      ]);
      setStats(progressRes.stats);
      setAttempts(attemptsRes.attempts || []);
    } catch (err: any) {
      setError(err.message || t('history.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await api.quiz.exportData();
      if (!res.ok) throw new Error(t('history.exportError'));
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || t('history.exportErrorDetail'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>
        <button onClick={fetchData} className="mt-4 text-blue-600 font-semibold">{t('admin.retry')}</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase">{t('history.title')}</h1>
          <p className="text-slate-500 text-sm">{t('history.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {exporting ? t('history.exporting') : t('history.exportData')}
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            {t('history.backToQuiz')}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label={t('history.totalAttempts')} value={stats.totalAttempts} />
          <StatCard label={t('history.completed')} value={stats.completedAttempts} />
          <StatCard
            label={t('history.bestScore')}
            value={stats.bestScore != null ? `${stats.bestScore}` : "-"}
          />
          <StatCard
            label={t('history.avgScore')}
            value={stats.averageScore != null ? `${Math.round(Number(stats.averageScore))}` : "-"}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-600">{t('history.date')}</th>
                <th className="text-left p-4 font-semibold text-slate-600">{t('history.status')}</th>
                <th className="text-right p-4 font-semibold text-slate-600">{t('history.score')}</th>
                <th className="text-right p-4 font-semibold text-slate-600">{t('history.correct')}</th>
                <th className="text-right p-4 font-semibold text-slate-600">{t('history.time')}</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-600">
                    {new Date(a.startedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {a.completedAt ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {t('history.completed')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        {t('history.inProgress')}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-800">
                    {a.score != null && a.totalQuestions != null
                      ? `${Math.round((a.score / a.totalQuestions) * 100)}%`
                      : "-"}
                  </td>
                  <td className="p-4 text-right text-slate-600">
                    {a.correctAnswers != null && a.totalQuestions != null
                      ? `${a.correctAnswers}/${a.totalQuestions}`
                      : "-"}
                  </td>
                  <td className="p-4 text-right text-slate-600">
                    {a.timeSpentSeconds != null ? `${a.timeSpentSeconds}s` : "-"}
                  </td>
                </tr>
              ))}
              {attempts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {t('history.noAttempts')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}

export default QuizHistory;
