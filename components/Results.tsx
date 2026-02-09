
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserProfile, UserAnswer, Question } from '../types';

import { useLanguage } from '../App';
import { translations } from '../translations';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PolarRadiusAxis
} from 'recharts';

interface ResultsProps {
  profile: UserProfile;
  answers: UserAnswer[];
  questions: Question[];
  onRestart: () => void;
}

interface ReportSettings {
  showChart: boolean;
  showDetailed: boolean;
}

const STORAGE_KEY = 'questio_pdf_settings';

const Tooltip: React.FC<{ children: React.ReactNode; text: string }> = ({ children, text }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-slate-800 translate-y-2 group-hover:translate-y-0">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

const Results: React.FC<ResultsProps> = ({ profile, answers, questions, onRestart }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [filterCategory, setFilterCategory] = useState<string>(t.all);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);



  // Customization Settings
  const [settings, setSettings] = useState<ReportSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {

      showChart: true,
      showDetailed: true
    };
  });

  // Saving states for feedback
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isInitialMount = useRef(true);

  const reportRef = useRef<HTMLDivElement>(null);
  const printTemplateRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Auto-save logic: Persist settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setIsSaving(true);
    const debounceTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setIsSaving(false);
      setSaveFeedback(true);
      const feedbackTimer = setTimeout(() => setSaveFeedback(false), 2000);
      return () => clearTimeout(feedbackTimer);
    }, 800);

    return () => clearTimeout(debounceTimer);
  }, [settings]);



  const toggleSetting = (key: keyof ReportSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadPDF = async () => {
    if (!printTemplateRef.current) return;
    setIsGeneratingPDF(true);

    const element = printTemplateRef.current;
    const opt = {
      margin: 0,
      filename: `${t.appName}_Report_${profile.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
      setIsGeneratingPDF(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('PDF generation failed:', error);
      setIsGeneratingPDF(false);
    }
  };

  const handleCloseAll = () => {
    setShowSuccess(false);
    setShowPreview(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: `${t.appName} Assessment Results`,
      text: `${t.draftingFor.replace('{name}', profile.name)} on ${t.appName}.`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n\nView more at: ${shareData.url}`);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch (err) {
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 2000);
      }
    }
  };

  const categoryMeta = useMemo(() => {
    const counts: Record<string, number> = {};
    const correctCounts: Record<string, number> = {};
    const categoryNameMap: Record<string, string> = {};

    questions.forEach(q => {
      const catKey = q.category.en;
      counts[catKey] = (counts[catKey] || 0) + 1;
      categoryNameMap[catKey] = q.category[language];
    });

    answers.forEach(ans => {
      const q = questions.find(q => q.id === ans.questionId);
      if (q && q.correctAnswerIndex === ans.answerIndex) {
        const catKey = q.category.en;
        correctCounts[catKey] = (correctCounts[catKey] || 0) + 1;
      }
    });

    const cats = Object.keys(counts).sort();
    const chartData = cats.map(catKey => ({
      category: categoryNameMap[catKey],
      score: Math.round(((correctCounts[catKey] || 0) / counts[catKey]) * 100),
      fullMark: 100
    }));

    return {
      all: [t.all, ...cats.map(k => categoryNameMap[k])],
      keys: cats,
      nameMap: categoryNameMap,
      counts,
      chartData
    };
  }, [questions, answers, language, t.all]);

  const filteredAnswers = useMemo(() => {
    if (filterCategory === t.all) return answers;
    return answers.filter(ans => {
      const q = questions.find(q => q.id === ans.questionId);
      return q?.category[language] === filterCategory;
    });
  }, [answers, filterCategory, questions, language, t.all]);

  const getLetter = (index: number) => String.fromCharCode(65 + index);

  const totalScore = useMemo(() => {
    return answers.filter(ans => {
      const q = questions.find(q => q.id === ans.questionId);
      return q?.correctAnswerIndex === ans.answerIndex;
    }).length;
  }, [answers, questions]);

  const CorrectIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg aria-label="Correct" role="img" className={`${className} text-emerald-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
    </svg>
  );

  const IncorrectIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg aria-label="Incorrect" role="img" className={`${className} text-rose-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  );

  const docRef = useMemo(() => `QST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 no-print" aria-labelledby="customization-heading">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h3 id="customization-heading" className="font-bold text-slate-800 flex items-center gap-2">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {t.reportInsights}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t.customSync}</p>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <div className="flex items-center gap-2 animate-pulse">
                <svg className="animate-spin h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.saving}</span>
              </div>
            )}
            {saveFeedback && (
              <span role="status" className="text-[10px] font-black uppercase text-emerald-600 tracking-widest animate-in fade-in slide-in-from-right-2">
                {t.settingsSaved}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => toggleSetting('showChart')} aria-pressed={settings.showChart} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${settings.showChart ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
            <span className="text-sm font-bold">{t.competencyTitle}</span>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.showChart ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.showChart ? 'left-6' : 'left-1'}`} />
            </div>
          </button>
          <button onClick={() => toggleSetting('showDetailed')} aria-pressed={settings.showDetailed} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${settings.showDetailed ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
            <span className="text-sm font-bold">{t.detailedTitle}</span>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.showDetailed ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.showDetailed ? 'left-6' : 'left-1'}`} />
            </div>
          </button>
        </div>
      </section>

      <div ref={reportRef} className="space-y-8">
        <header className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32" aria-hidden="true"></div>
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">{t.summaryTitle}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-slate-600 font-medium text-lg">
                <span className="text-slate-900 font-bold">{profile.name}</span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="text-blue-600">{profile.role}</span>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{t.overallScore}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-blue-600 leading-none" aria-label={`Score: ${totalScore} / ${questions.length}`}>{totalScore}</span>
                <span className="text-2xl font-bold text-slate-400" aria-hidden="true">/ {questions.length}</span>
              </div>
            </div>
          </div>
        </header>



        {settings.showChart && (
          <section className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              {t.competencyTitle}
            </h3>
            <div className="h-[350px] w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryMeta.chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Proficiency" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} strokeWidth={3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {settings.showDetailed && (
          <section className="pt-8 border-t border-slate-200">
            <div className="flex flex-col space-y-6 mb-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                    {t.detailedTitle}
                  </h3>
                  <p className="text-slate-500 font-medium">
                    {t.performanceMatrix}
                  </p>
                </div>

                <div className="flex items-center gap-4 no-print">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollTabs('left')}
                      className="p-3 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                      aria-label="Scroll left"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => scrollTabs('right')}
                      className="p-3 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                      aria-label="Scroll right"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <button onClick={onRestart} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-xl shadow-slate-200 active:scale-95">{t.retake}</button>
                </div>
              </div>

              <div className="no-print relative" role="tablist" aria-label="Filter">
                <div ref={tabsRef} className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-4 scroll-smooth mask-linear-fade">
                  {categoryMeta.all.map(cat => {
                    const count = cat === t.all ? answers.length : answers.filter(a => questions.find(q => q.id === a.questionId)?.category[language] === cat).length;
                    const isActive = filterCategory === cat;
                    return (
                      <button
                        key={cat}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setFilterCategory(cat)}
                        className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${isActive
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
                      >
                        {cat} <span className={`ml-1 opacity-60 ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAnswers.map((ans) => {
                const q = questions.find(q => q.id === ans.questionId)!;
                const isCorrect = ans.answerIndex === q.correctAnswerIndex;
                const originalIdx = questions.findIndex(ques => ques.id === ans.questionId);
                return (
                  <article key={ans.questionId} className="group p-6 md:p-8 bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-200 rounded-3xl transition-all duration-300">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">#{originalIdx + 1}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{q.category[language]}</span>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {isCorrect ? t.correct : t.incorrect}
                        </div>
                      </div>

                      <h4 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                        {q.text[language]}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {q.options[language].map((option, idx) => {
                          const letter = getLetter(idx);
                          const isThisCorrectIndex = idx === q.correctAnswerIndex;
                          const isThisUserSelection = idx === ans.answerIndex;

                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${isThisCorrectIndex
                                  ? 'bg-emerald-50/50 border-emerald-200/60'
                                  : isThisUserSelection && !isCorrect
                                    ? 'bg-rose-50/50 border-rose-200/60'
                                    : 'bg-white border-slate-100 opacity-60 hover:opacity-100'
                                }`}
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black border ${isThisCorrectIndex
                                  ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                  : isThisUserSelection && !isCorrect
                                    ? 'bg-rose-100 border-rose-200 text-rose-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-400'
                                }`}>
                                {letter}
                              </div>
                              <div className="flex-grow">
                                <span className={`text-sm ${isThisCorrectIndex
                                    ? 'font-bold text-emerald-900'
                                    : isThisUserSelection && !isCorrect
                                      ? 'font-bold text-rose-900'
                                      : 'font-medium text-slate-600'
                                  }`}>
                                  {option}
                                </span>
                              </div>
                              {isThisUserSelection && (
                                <div className="flex-shrink-0">
                                  {isCorrect ? <CorrectIcon className="w-4 h-4 text-emerald-600" /> : <IncorrectIcon className="w-4 h-4 text-rose-600" />}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-16 no-print">
        <Tooltip text={t.isoA4Desc}>
          <button
            onClick={() => setShowPreview(true)}
            className="group flex items-center gap-3 px-6 py-4 w-full md:w-64 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 border border-slate-700"
          >
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <div className="flex flex-col items-start">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80 text-blue-100/60">PDF</span>
              <span className="font-bold text-sm">{t.exportPdf}</span>
            </div>
          </button>
        </Tooltip>

        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

        <Tooltip text={t.printReport}>
          <button
            onClick={() => window.print()}
            className="group flex items-center gap-3 px-6 py-4 w-full md:w-64 bg-white text-slate-700 rounded-2xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 012 2h6a2 2 0 012-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-sm">{t.printReport}</span>
          </button>
        </Tooltip>

        <Tooltip text={shareStatus === 'copied' ? t.copied : t.shareResults}>
          <button
            onClick={handleShare}
            className="group flex items-center gap-3 px-6 py-4 w-full md:w-64 bg-white text-slate-700 rounded-2xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </div>
            <span className="font-bold text-sm">{shareStatus === 'copied' ? t.copied : t.shareResults}</span>
          </button>
        </Tooltip>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300" role="dialog" aria-modal="true" aria-labelledby="preview-modal-title">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg" onClick={() => !isGeneratingPDF && !showSuccess && setShowPreview(false)}></div>
          <div className="relative w-full max-w-7xl h-full max-h-[92vh] bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
            {(isGeneratingPDF || showSuccess) && (
              <div className="absolute inset-0 z-[110] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300" role="status">
                {isGeneratingPDF ? (
                  <>
                    <div className="relative"><div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><span className="text-white font-black text-sm">Q</span></div></div></div>
                    <div className="mt-8 text-center"><h4 className="text-2xl font-black text-slate-900 tracking-tight">{t.finalizing}</h4><p className="text-sm text-slate-500 mt-2 font-medium">{t.isoA4Desc}</p></div>
                  </>
                ) : (
                  <div className="flex flex-col items-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-8 shadow-xl shadow-emerald-100">
                      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t.successTitle}</h4>
                    <p className="text-slate-500 font-medium max-w-sm text-center px-4">{t.successDesc}</p>
                    <button
                      onClick={handleCloseAll}
                      className="mt-10 px-12 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                    >
                      {t.done}
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="bg-slate-950 px-10 py-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-5"><div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg" aria-hidden="true">Q</div><div><h3 id="preview-modal-title" className="text-xl font-black text-white tracking-tight leading-tight">{t.previewTitle}</h3><p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{t.isoA4}</p></div></div>
              <button onClick={() => setShowPreview(false)} disabled={isGeneratingPDF || showSuccess} aria-label="Close" className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-grow overflow-y-auto p-8 md:p-14 bg-slate-800/40 flex flex-col items-center custom-scrollbar">
              <div className="relative w-full max-w-[210mm] min-h-[297mm] bg-white shadow-[0_0_100px_rgba(0,0,0,0.6)] overflow-hidden origin-top my-6">
                <div ref={printTemplateRef} className="w-full bg-white min-h-[297mm] p-[25mm_30mm] flex flex-col text-slate-900">
                  <div className="border-b-[6px] border-blue-600 pb-10 flex justify-between items-start mb-14">
                    <div className="space-y-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-200">Q</div><div className="flex flex-col"><span className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">{t.appName}</span><span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1">Intelligence</span></div></div><div><h1 className="text-5xl font-black text-slate-950 tracking-tighter leading-none mb-2">{language === 'id' ? 'Asesmen Profesional' : 'Professional Assessment'}</h1><div className="flex items-center gap-4 text-slate-600 text-[11px] font-black uppercase tracking-widest"><span className="text-blue-600">{profile.name}</span><span className="opacity-20">|</span><span>{profile.role}</span></div></div></div>
                    <div className="text-right flex flex-col items-end pt-2"><div className="px-8 py-5 bg-slate-950 text-white rounded-2xl mb-3 shadow-2xl shadow-slate-300"><span className="text-[10px] block font-black uppercase opacity-60 tracking-[0.1em] mb-1">{t.finalIndex}</span><span className="text-4xl font-black block leading-none">{totalScore} / {questions.length}</span></div><span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{t.verifiedResult}</span></div>
                  </div>
                  <div className="flex-grow flex flex-col gap-16">

                    {settings.showChart && (<section className="space-y-6"><div className="flex items-center gap-3 border-l-[6px] border-blue-600 pl-6 py-2"><h2 className="text-[12px] font-black text-slate-950 uppercase tracking-[0.25em]">{t.competencyArch}</h2></div><div className="h-[360px] w-full border border-slate-100 rounded-[2.5rem] p-12 bg-white shadow-sm flex items-center justify-center"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryMeta.chartData}><PolarGrid stroke="#e2e8f0" strokeWidth={1} /><PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#1e293b' }} /><Radar name="Proficiency" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} strokeWidth={3} /></RadarChart></ResponsiveContainer></div></section>)}
                    {settings.showDetailed && (<section className="space-y-10 pb-16"><div className="flex items-center gap-3 border-l-[6px] border-blue-600 pl-6 py-2"><h2 className="text-[12px] font-black text-slate-950 uppercase tracking-[0.25em]">{t.performanceMatrix}</h2></div><div className="grid grid-cols-1 gap-y-14">
                      {answers.map((ans, i) => {
                        const q = questions.find(q => q.id === ans.questionId)!;
                        const isCorrect = ans.answerIndex === q.correctAnswerIndex;
                        return (<div key={i} className="flex gap-10 items-start page-break-avoid"><div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg font-black text-white shadow-lg ${isCorrect ? 'bg-emerald-600' : 'bg-rose-600'}`}>{i + 1}</div><div className="flex-grow space-y-6 pt-1"><div className="flex items-start justify-between">
                          <p className="text-[32px] font-black text-slate-950 leading-tight pr-6 tracking-tighter">
                            {q.text[language]}
                          </p>
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl whitespace-nowrap">{q.category[language]}</span></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options[language].map((option, idx) => {
                              const isCorrectOpt = idx === q.correctAnswerIndex;
                              const isUserSelection = idx === ans.answerIndex;
                              return (<div key={idx} className={`text-[12px] p-4 rounded-2xl border flex items-center justify-between transition-all ${isCorrectOpt ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-1 ring-emerald-100' : isUserSelection && !isCorrect ? 'bg-rose-50 border-rose-500 text-rose-950 font-black ring-1 ring-rose-100' : 'bg-white border-slate-200 text-slate-800 font-semibold'}`}><div className="flex items-center gap-4"><span className="font-bold opacity-30 text-[10px]">{getLetter(idx)}</span><span>{option}</span></div>{isUserSelection && (<div className="flex-shrink-0 ml-3">{isCorrect ? <CorrectIcon className="w-6 h-6" /> : <IncorrectIcon className="w-6 h-6" />}</div>)}</div>);
                            })}
                          </div></div></div>);
                      })}
                    </div></section>)}
                  </div>
                  <div className="mt-16 pt-10 border-t-2 border-slate-100 flex justify-between items-end text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]"><div className="flex flex-col gap-2"><div className="flex items-center gap-5"><span className="text-slate-950">{t.appName} Insights &copy; {new Date().getFullYear()}</span><span className="opacity-20">•</span><span>{t.officialReport}</span></div><div className="text-[9px] opacity-60 tracking-normal font-bold">{t.docId}: <span className="text-slate-900">{docRef}</span></div></div><div className="text-right flex flex-col items-end gap-2"><div className="bg-slate-50 px-4 py-1.5 rounded-lg text-slate-950 border border-slate-200 font-black tracking-widest flex items-center gap-2"><span className="text-blue-600 opacity-60">{t.page}</span> 01 / 01</div><div className="text-[9px] opacity-60 tracking-normal font-bold uppercase">{t.issued}: {new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div></div></div>
                </div>
              </div>
            </div>
            <div className="bg-slate-950 px-12 py-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 shrink-0">
              <div className="hidden md:flex items-center gap-5"><div className="w-14 h-14 rounded-[1.25rem] bg-slate-900 flex items-center justify-center text-blue-400 border border-slate-800 shadow-inner" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div><div className="flex flex-col"><span className="text-base font-black text-white leading-tight">{t.isoA4Cert}</span><span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{t.isoA4Desc}</span></div></div>
              <div className="flex items-center gap-5 w-full md:w-auto"><button onClick={() => setShowPreview(false)} disabled={isGeneratingPDF || showSuccess} className="flex-1 md:flex-none px-10 py-4 bg-slate-900 text-slate-300 font-black uppercase tracking-widest text-xs rounded-2xl border border-slate-800 hover:bg-slate-800 hover:text-white transition-all">{t.discard}</button><button onClick={handleDownloadPDF} disabled={isGeneratingPDF || showSuccess} className={`flex-1 md:flex-none px-14 py-4 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-4 transition-all ${isGeneratingPDF || showSuccess ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-900/40 active:scale-95'}`}>{isGeneratingPDF ? (<><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t.finalizing}</>) : (<><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>{t.generatePdf}</>)}</button></div>
            </div>
          </div>
        </div>
      )}
      <style>{`@media print {.no-print { display: none !important; } body { background: white !important; } } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .no-scrollbar::-webkit-scrollbar { display: none; } .custom-scrollbar::-webkit-scrollbar { width: 10px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 5px; border: 2px solid transparent; background-clip: content-box; } .page-break-avoid { page-break-inside: avoid; }`}</style>
    </div>
  );
};

export default Results;
